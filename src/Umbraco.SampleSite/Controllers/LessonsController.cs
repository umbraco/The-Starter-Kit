using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Runtime.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Umbraco.Cms.Core.Cache;
using Umbraco.Cms.Core.Configuration;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.BackOffice.Controllers;
using Umbraco.Cms.Web.BackOffice.Filters;
using Umbraco.Cms.Web.Common.Attributes;
using Umbraco.Extensions;

namespace Umbraco.SampleSite.Controllers
{
    [PluginController("Starterkit")]
    public class LessonsController : UmbracoAuthorizedJsonController
    {
        private readonly IBackOfficeSecurityAccessor _backofficeSecurityAccessor;
        private readonly IUmbracoVersion _umbracoVersion;
        private readonly ILogger<LessonsController> _logger;
        private readonly IAppPolicyCache _runtimeCache;

        public LessonsController(IBackOfficeSecurityAccessor backofficeSecurityAccessor, IUmbracoVersion umbracoVersion,
            ILogger<LessonsController> logger, IAppPolicyCache runtimeCache)
        {
            _backofficeSecurityAccessor = backofficeSecurityAccessor;
            _umbracoVersion = umbracoVersion;
            _logger = logger;
            _runtimeCache = runtimeCache;
        }

        /// <summary>
        /// Fetches available lessons for a given section from our.umbaco.org
        /// </summary>
        /// <param name="path">Name of the documentation section to fetch from, ex: "getting-started", "Tutorials/Starter-kit/Lessons" </param>
        /// <returns></returns>
        [ValidateAngularAntiForgeryToken]
        public async Task<IEnumerable<Lesson>> GetLessons(string path)
        {
            //information for the request, so we could in the future filter by user, allowed sections, langugae and user-type
            var user = _backofficeSecurityAccessor.BackOfficeSecurity.CurrentUser;
            var userType = string.Empty; //This is not in recent versions of Umbraco & the API Controller on our.umb does nothing with this data currently
            var allowedSections = string.Join(",", user.AllowedSections);
            var language = user.Language;
            var version = _umbracoVersion.SemanticVersion.ToSemanticString();

            //construct the url and cache key
            var url =
                $"https://our.umbraco.org/Umbraco/Documentation/Lessons/GetDocsForPath?path={path}&userType={userType}&allowedSections={allowedSections}&lang={language}&version={version}";
            var key = "umbraco-lessons-" + userType + language + allowedSections.Replace(",", "-") + path;

            var result = new List<Lesson>();

            Func<List<Lesson>> fetchLesson = () =>
            {
                try
                {
                    using var web = new HttpClient();
                    //fetch dashboard json and parse to JObject
                    var json = web.GetStringAsync(url);
                    result = JsonConvert.DeserializeObject<IEnumerable<Lesson>>(json.Result).ToList();
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

            return result;
        }


        /// <summary>
        /// This gets the steps that make up a specific lesson
        /// </summary>
        /// <param name="path"></param>
        /// <returns></returns>
        [ValidateAngularAntiForgeryToken]
        public async Task<IEnumerable<LessonStep>> GetLessonSteps(string path)
        {
            var url = $"https://our.umbraco.org/Umbraco/Documentation/Lessons/GetStepsForPath?path={path}";
            using var web = new HttpClient();
            //fetch dashboard json and parse to JObject
            var json = await web.GetStringAsync(url);
            return JsonConvert.DeserializeObject<List<LessonStep>>(json);
        }
    }

    /// <summary>
    /// Simple POCO for binding JSON from our.umbraco WebAPI
    /// </summary>
    [DataContract(Name = "lesson")]
    public class Lesson
    {
        [DataMember(Name = "name")]
        public string Name { get; set; }

        [DataMember(Name = "path")]
        public string Path { get; set; }

        [DataMember(Name = "level")]
        public string Level { get; set; }

        [DataMember(Name = "url")]
        public string Url { get; set; }

        [DataMember(Name = "directories")]
        public IEnumerable<Lesson> Directories { get; set; }
    }


    /// <summary>
    /// Simple POCO for binding JSON from our.umbraco WebAPI
    /// </summary>
    [DataContract(Name = "LesssonStep")]
    public class LessonStep
    {
        [DataMember(Name = "name")]
        public string Name { get; set; }

        [DataMember(Name = "content")]
        public string Content { get; set; }
    }
}