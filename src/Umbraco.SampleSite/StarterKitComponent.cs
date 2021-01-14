using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
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
        
        private readonly IMacroService _macroService;
        private readonly IContentTypeService _contentTypeService;
        private readonly IDataTypeService _dataTypeService;
        private readonly IFileService _fileService;
        private readonly ILogger<FormsInstallationHelper> _logger;
        private readonly LinkGenerator _linkGenerator;

        public StarterKitComponent(IMacroService macroService, IContentTypeService contentTypeService,
            IDataTypeService dataTypeService, IFileService fileService, ILogger<FormsInstallationHelper> logger,
            LinkGenerator linkGenerator)
        {
            _macroService = macroService ?? throw new ArgumentNullException(nameof(macroService));
            _contentTypeService = contentTypeService ?? throw new ArgumentNullException(nameof(contentTypeService));
            _dataTypeService = dataTypeService ?? throw new ArgumentNullException(nameof(dataTypeService));
            _fileService = fileService ?? throw new ArgumentNullException(nameof(fileService));
            _logger = logger;
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
                var formsInstallHelper = new FormsInstallationHelper(_macroService, _contentTypeService, _dataTypeService, _fileService, _logger);
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
        {

        }
    }
}
