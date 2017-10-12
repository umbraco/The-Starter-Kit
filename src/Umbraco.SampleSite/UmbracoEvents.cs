using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using Umbraco.Core;
using Umbraco.Core.Services;
using Umbraco.SampleSite.Controllers;
using Umbraco.Web;
using Umbraco.Web.UI.JavaScript;

namespace Umbraco.SampleSite
{
    public class UmbracoEvents : ApplicationEventHandler
    {
        protected override void ApplicationStarted(UmbracoApplicationBase umbracoApplication, ApplicationContext applicationContext)
        {
            PackagingService.ImportedPackage += PackagingService_ImportedPackage;
            ServerVariablesParser.Parsing += ServerVariablesParser_Parsing;
        }

        /// <summary>
        ///  When the Umbraco Forms package is installed this will update the contact template and the forms picker property type
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void PackagingService_ImportedPackage(IPackagingService sender, Core.Events.ImportPackageEventArgs<Core.Packaging.Models.InstallationSummary> e)
        {
            if (e != null && e.PackageMetaData != null && e.PackageMetaData.Name == "Umbraco Forms")
            {
                var formsInstallHelper = new FormsInstallationHelper(ApplicationContext.Current.Services);
                formsInstallHelper.UpdateUmbracoDataForFormsInstallation();
            }
        }

        /// <summary>
        /// This is used to register the API Controller url/path into the global JS object
        /// 'Umbraco.Sys.ServerVariables' for our AngularJS Resource to request the correct URL
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="dictionary"></param>
        private void ServerVariablesParser_Parsing(object sender, Dictionary<string, object> dictionary)
        {
            if (!dictionary.ContainsKey("umbracoUrls"))
                throw new Exception("Missing umbracoUrls.");

            var umbracoUrlsObject = dictionary["umbracoUrls"];
            if (umbracoUrlsObject == null)
                throw new Exception("Null umbracoUrls");

            if (!(umbracoUrlsObject is Dictionary<string, object> umbracoUrls))
                throw new Exception("Invalid umbracoUrls");

            //Code needed in order to retrieve a URLHelper
            if (HttpContext.Current == null) throw new InvalidOperationException("HttpContext is null");
            var urlHelper = new UrlHelper(new RequestContext(new HttpContextWrapper(HttpContext.Current), new RouteData()));

            //Add to 'Umbraco.Sys.ServerVariables.umbracoUrls.lessonsApiBaseUrl' global JS object
            //The URL/route for this API endpoint to be consumed by the Lessons AngularJS Service
            umbracoUrls["lessonsApiBaseUrl"] = urlHelper.GetUmbracoApiServiceBaseUrl<LessonsController>(controller => controller.GetLessons(""));
        }
    }
}
