using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Cache;
using Umbraco.Cms.Core.Configuration;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Web.BackOffice.Controllers;
using Umbraco.Cms.Web.BackOffice.Filters;
using Umbraco.Cms.Web.Common.Attributes;
using Umbraco.Extensions;
using Umbraco.SampleSite.Models;

namespace Umbraco.SampleSite.Controllers;

[PluginController("Starterkit")]
public class LessonsController : UmbracoAuthorizedJsonController
{
    private readonly IBackOfficeSecurityAccessor _backofficeSecurityAccessor;
    private readonly IUmbracoVersion _umbracoVersion;
    private readonly ILogger<LessonsController> _logger;
    private readonly IAppPolicyCache _runtimeCache;
    private readonly IJsonSerializer _jsonSerializer;

    public LessonsController(IBackOfficeSecurityAccessor backofficeSecurityAccessor, IUmbracoVersion umbracoVersion,
        ILogger<LessonsController> logger, IAppPolicyCache runtimeCache, IJsonSerializer jsonSerializer)
    {
        _backofficeSecurityAccessor = backofficeSecurityAccessor;
        _umbracoVersion = umbracoVersion;
        _logger = logger;
        _runtimeCache = runtimeCache;
        _jsonSerializer = jsonSerializer;
    }

    /// <summary>
    /// Fetches available lessons for a given section from our.umbaco.org
    /// </summary>
    /// <param name="path">Name of the documentation section to fetch from, ex: "getting-started", "Tutorials/Starter-kit/Lessons" </param>
    /// <returns></returns>
    [ValidateAngularAntiForgeryToken]
    public IEnumerable<LessonModel> GetLessons(string path)
    {
        //information for the request, so we could in the future filter by user, allowed sections, langugae and user-type
        IUser? user = _backofficeSecurityAccessor.BackOfficeSecurity?.CurrentUser;
        string userType = string.Empty; //This is not in recent versions of Umbraco & the API Controller on our.umb does nothing with this data currently
        string allowedSections = string.Empty;
        string? language = string.Empty;

        if (user is not null)
        {
            allowedSections = string.Join(",", user.AllowedSections);
            language = user.Language;
        }

        string version = _umbracoVersion.SemanticVersion.ToSemanticString();

        //construct the url and cache key
        string url =
            $"https://our.umbraco.org/Umbraco/Documentation/Lessons/GetDocsForPath?path={path}&userType={userType}&allowedSections={allowedSections}&lang={language}&version={version}";
        string key = "umbraco-lessons-" + userType + language + allowedSections.Replace(",", "-") + path;

        List<LessonModel>? result = new();

        Func<List<LessonModel>?> fetchLesson = () =>
        {
            try
            {
                using var web = new HttpClient();
                //fetch dashboard json and parse to JObject
                Task<string> json = web.GetStringAsync(url);
                result = _jsonSerializer.Deserialize<IEnumerable<LessonModel>>(json.Result)?.ToList();
            }
            catch (HttpRequestException ex)
            {
                //Log it so we are aware there was an issue
                _logger.LogError(ex, "Error getting lesson content from {Url} ': {ExMessage}\n{InnerEx}", url, ex.Message, ex.InnerException);

                //The result is still a new/empty JObject() - So we will return it like this to avoid error codes which triggers UI warnings
                //So this will cache an empty response until cache expires
            }

            return result;
        };

        //Get cache item or add new cache item with func
        result = _runtimeCache.GetCacheItem(key, fetchLesson, new TimeSpan(0, 30, 0));

        return result ?? Enumerable.Empty<LessonModel>();
    }


    /// <summary>
    /// This gets the steps that make up a specific lesson
    /// </summary>
    /// <param name="path"></param>
    /// <returns></returns>
    [ValidateAngularAntiForgeryToken]
    public async Task<IEnumerable<LessonStepModel>> GetLessonSteps(string path)
    {
        string url = $"https://our.umbraco.org/Umbraco/Documentation/Lessons/GetStepsForPath?path={path}";
        using HttpClient web = new();
        //fetch dashboard json and parse to JObject
        string json = await web.GetStringAsync(url);
        return _jsonSerializer.Deserialize<List<LessonStepModel>>(json) ?? Enumerable.Empty<LessonStepModel>();
    }
}
