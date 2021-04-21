using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Routing;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Infrastructure.WebAssets;
using Umbraco.Extensions;
using Umbraco.SampleSite.Controllers;

namespace Umbraco.SampleSite
{
    public class StarterKitNotificationHandler : INotificationHandler<ImportedPackageNotification>, INotificationHandler<ServerVariablesParsing>
    {
        private readonly FormsInstallationHelper _formsInstallationHelper;
        private readonly LinkGenerator _linkGenerator;

        public StarterKitNotificationHandler(FormsInstallationHelper formsInstallationHelper, LinkGenerator linkGenerator)
        {
            _formsInstallationHelper = formsInstallationHelper;
            _linkGenerator = linkGenerator;
        }

        /// <summary>
        /// Handles the <see cref="ServerVariablesParsing"/> notification to add custom urls
        /// </summary>
        public void Handle(ServerVariablesParsing notification)
        {
            IDictionary<string, object> serverVars = notification.ServerVariables;

            if (!serverVars.ContainsKey("umbracoUrls"))
            {
                throw new ArgumentException("Missing umbracoUrls.");
            }
            
            var umbracoUrlsObject = serverVars["umbracoUrls"];
            if (umbracoUrlsObject == null)
            {
                throw new ArgumentException("Null umbracoUrls");
            }

            if (!(umbracoUrlsObject is Dictionary<string, object> umbracoUrls))
            {
                throw new ArgumentException("Invalid umbracoUrls");
            }

            //Add to 'Umbraco.Sys.ServerVariables.umbracoUrls.lessonsApiBaseUrl' global JS object
            //The URL/route for this API endpoint to be consumed by the Lessons AngularJS Service
            umbracoUrls["lessonsApiBaseUrl"] = _linkGenerator.GetUmbracoApiServiceBaseUrl<LessonsController>(controller => controller.GetLessons(""));
        }

        public void Handle(ImportedPackageNotification notification)
        {
            if (notification?.PackageMetaData != null && notification.PackageMetaData.Name == "Umbraco Forms")
            {
                _formsInstallationHelper.UpdateUmbracoDataForFormsInstallation();
            }
        }
    }
}
