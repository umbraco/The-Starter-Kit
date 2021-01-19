using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Routing;
using Umbraco.Core.Composing;
using Umbraco.Core.Events;
using Umbraco.Core.Models.Packaging;
using Umbraco.Core.Services;
using Umbraco.Core.Services.Implement;
using Umbraco.Extensions;
using Umbraco.SampleSite.Controllers;
using Umbraco.Web.WebAssets;

namespace Umbraco.SampleSite
{
    public class StarterKitComponent : IComponent
    {
        private readonly FormsInstallationHelper _formsInstallationHelper;
        private readonly LinkGenerator _linkGenerator;

        public StarterKitComponent(FormsInstallationHelper formsInstallationHelper, LinkGenerator linkGenerator)
        {
            _formsInstallationHelper = formsInstallationHelper;
            _linkGenerator = linkGenerator;
        }

        /// <summary>
        ///  When the Umbraco Forms package is installed this will update the contact template and the forms picker property type
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void PackagingService_ImportedPackage(IPackagingService sender, ImportPackageEventArgs<InstallationSummary> e)
        {
            if (e != null && e.PackageMetaData != null && e.PackageMetaData.Name == "Umbraco Forms")
            {
                _formsInstallationHelper.UpdateUmbracoDataForFormsInstallation();
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

            //Add to 'Umbraco.Sys.ServerVariables.umbracoUrls.lessonsApiBaseUrl' global JS object
            //The URL/route for this API endpoint to be consumed by the Lessons AngularJS Service
            umbracoUrls["lessonsApiBaseUrl"] = _linkGenerator.GetUmbracoApiServiceBaseUrl<LessonsController>(controller => controller.GetLessons(""));
        }

        public void Initialize()
        {
            PackagingService.ImportedPackage += PackagingService_ImportedPackage;
            ServerVariablesParser.Parsing += ServerVariablesParser_Parsing;
        }

        public void Terminate()
        { }
    }
}
