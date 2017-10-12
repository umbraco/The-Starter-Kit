using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Runtime.Serialization;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Umbraco.Core;
using Umbraco.Core.Cache;
using Umbraco.Core.Configuration;
using Umbraco.Core.Logging;
using Umbraco.Web.Editors;
using Umbraco.Web.Mvc;
using Umbraco.Web.WebApi.Filters;

namespace Umbraco.SampleSite.Controllers
{
    [PluginController("Starterkit")]
    public class LessonsController : UmbracoAuthorizedJsonController
    {
        /// <summary>
        /// Fetches available lessons for a given section from our.umbaco.org
        /// </summary>
        /// <param name="path">Name of the documentation section to fetch from, ex: "getting-started", "Tutorials/Starter-kit/Lessons" </param>
        /// <returns></returns>
        [ValidateAngularAntiForgeryToken]
        public async Task<IEnumerable<Lesson>> GetLessons(string path)
        {
            //information for the request, so we could in the future filter by user, allowed sections, langugae and user-type
            var user = Security.CurrentUser;
            var userType = user.UserType.Alias;
            var allowedSections = string.Join(",", user.AllowedSections);
            var language = user.Language;
            var version = UmbracoVersion.GetSemanticVersion().ToSemanticString();

            //construct the url and cache key
            var url = string.Format("https://our.umbraco.org/Umbraco/Documentation/Lessons/GetDocsForPath?path={0}&userType={1}&allowedSections={2}&lang={3}&version={4}", path, userType, allowedSections, language, version);
            var key = "umbraco-lessons-" + userType + language + allowedSections.Replace(",", "-") + path;

            //try and find an already cached version of this request
            var content = ApplicationContext.ApplicationCache.RuntimeCache.GetCacheItem<List<Lesson>>(key);

            var result = new List<Lesson>();
            if (content != null)
            {
                //Return it from the cache
                result = content;
            }
            else
            {
                //content is null, go get it
                try
                {
                    using (var web = new HttpClient())
                    {
                        //fetch dashboard json and parse to JObject
                        var json = await web.GetStringAsync(url);
                        result = JsonConvert.DeserializeObject<IEnumerable<Lesson>>(json).ToList();
                    }

                    //Cache the request for 30 minutes
                    ApplicationContext.ApplicationCache.RuntimeCache.InsertCacheItem<List<Lesson>>(key, () => result, new TimeSpan(0, 30, 0));
                }
                catch (HttpRequestException ex)
                {
                    LogHelper.Debug<LessonsController>(string.Format("Error getting lesson content from '{0}': {1}\n{2}", url, ex.Message, ex.InnerException));

                    //The result is still a new/empty JObject() - we return it like this to avoid error codes which triggers UI warnings
                    //And cache this empty result for 5 minutes as our.umb may have newtworking issues
                    ApplicationContext.ApplicationCache.RuntimeCache.InsertCacheItem<List<Lesson>>(key, () => result, new TimeSpan(0, 5, 0));
                }
            }

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
            var url = string.Format("https://our.umbraco.org/Umbraco/Documentation/Lessons/GetStepsForPath?path={0}", path);
            using (var web = new HttpClient())
            {
                //fetch dashboard json and parse to JObject
                var json = await web.GetStringAsync(url);
                return JsonConvert.DeserializeObject<List<LessonStep>>(json);
            }
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