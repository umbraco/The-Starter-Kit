using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml.Linq;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Umbraco.Core;
using Umbraco.Core.Configuration.Models;
using Umbraco.Core.IO;
using Umbraco.Core.Models;
using Umbraco.Core.PackageActions;
using Umbraco.Core.PropertyEditors;
using Umbraco.Core.Serialization;
using Umbraco.Core.Services;
using Umbraco.Core.Strings;

namespace Umbraco.SampleSite
{
    public class InstallPackageAction : IPackageAction
    {
        private readonly IContentService _contentService;
        private readonly IMediaTypeService _mediaTypeService;
        private readonly IMediaService _mediaService;
        private readonly IFileService _fileService;
        private readonly IOptions<ContentSettings> _contentSettings;
        private readonly FormsInstallationHelper _formsInstallHelper;
        private readonly ILogger<InstallPackageAction> _logger;
        private readonly MediaUrlGeneratorCollection _mediaUrlGenerators;
        private readonly IMediaFileSystem _mediaFileSystem;
        private readonly IShortStringHelper _shortStringHelper;
        private readonly IContentTypeBaseServiceProvider _contentTypeBaseServiceProvider;
        private readonly IJsonSerializer _serializer;

        public InstallPackageAction(IContentService contentService, IMediaTypeService mediaTypeService,
            IMediaService mediaService, IFileService fileService, IOptions<ContentSettings> contentSettings,
            FormsInstallationHelper formsInstallHelper, ILogger<InstallPackageAction> logger, MediaUrlGeneratorCollection mediaUrlGenerators,
            IMediaFileSystem mediaFileSystem, IShortStringHelper shortStringHelper, IContentTypeBaseServiceProvider contentTypeBaseServiceProvider,
            IJsonSerializer serializer)
        {
            _contentService = contentService;
            _mediaTypeService = mediaTypeService;
            _mediaService = mediaService;
            _fileService = fileService;
            _contentSettings = contentSettings;
            _formsInstallHelper = formsInstallHelper;
            _logger = logger;
            _mediaUrlGenerators = mediaUrlGenerators;
            _mediaFileSystem = mediaFileSystem;
            _shortStringHelper = shortStringHelper;
            _contentTypeBaseServiceProvider = contentTypeBaseServiceProvider;
            _serializer = serializer;
        }

        public bool Execute(string packageName, XElement xmlData)
        {
            _formsInstallHelper.UpdateUmbracoDataForNonFormsInstallation();
            _formsInstallHelper.UpdateUmbracoDataForFormsInstallation();

            // update master view for all templates (packager doesn't support this)
            var master = _fileService.GetTemplate("master");
            if (master != null)
            {
                var templatesToFind = new[] { "Blog", "Blogpost", "contact", "contentPage", "home", "people", "Person", "Product", "Products" };
                foreach (var template in _fileService.GetTemplates().Where(x => templatesToFind.InvariantContains(x.Alias)))
                {
                    // we'll update the master template for all templates that doesn't have one already
                    if (template.Alias != master.Alias && (
                            template.IsMasterTemplate == false && string.IsNullOrWhiteSpace(template.MasterTemplateAlias)))
                    {
                        template.SetMasterTemplate(master);
                        _fileService.SaveTemplate(template);
                    }
                }
            }

            // create media folders

            CreateMediaItem(_mediaService, _mediaTypeService, -1, "folder", new Guid("b6f11172-373f-4473-af0f-0b0e5aefd21c"), "Design", string.Empty, true);
            CreateMediaItem(_mediaService, _mediaTypeService, -1, "folder", new Guid("1fd2ecaf-f371-4c00-9306-867fa4585e7a"), "People", string.Empty, true);
            CreateMediaItem(_mediaService, _mediaTypeService, -1, "folder", new Guid("6d5bf746-cb82-45c5-bd15-dd3798209b87"), "Products", string.Empty, true);

            // create media
            IMedia mediaRoot = _mediaService.GetById(-1);
            IEnumerable<IMedia> rootMedia = _mediaService.GetRootMedia().ToArray();

            try
            {
                foreach (XElement selectNode in xmlData.Elements("mediaItem"))
                {
                    IMedia media1 = mediaRoot;
                    foreach (IMedia media2 in rootMedia)
                    {
                        if (media2.Name.InvariantEquals((string)selectNode.Attribute("folder")))
                            media1 = media2;
                    }

                    // add UDI support
                    var key = selectNode.Attribute("key") != null &&
                              string.IsNullOrWhiteSpace((string)selectNode.Attribute("key")) == false
                        ? Guid.Parse((string)selectNode.Attribute("key"))
                        : Guid.Empty;

                    int mediaItem = CreateMediaItem(_mediaService, _mediaTypeService, media1.Id, "image", key, (string)selectNode.Attribute("name"), (string)selectNode.Attribute("path"), false);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during post processing of Starter Kit");
            }

            GridMediaFixup(_contentService, _mediaService, _contentSettings, _mediaUrlGenerators);

            var contentHome = _contentService.GetRootContent().FirstOrDefault(x => x.ContentType.Alias == "home");
            if (contentHome != null)
            {
                // publish everything (moved here due to Deploy dependency checking)
                _contentService.SaveAndPublishBranch(contentHome, true);
            }
            else
            {
                _logger.LogWarning("The installed Home page was not found");
            }

            return true;
        }
        
        public string Alias()
        {
            return "SampleSiteInitialContent";
        }

        public bool Undo(string packageName, XElement xmlData)
        {
            //see https://github.com/umbraco/7.6-Starter-Kit/issues/26 - perhaps it's not a good idea to remove the form
            //FormsInstallationHelper.RemoveStarterKitForm();
            return true;
        }

        private void GridMediaFixup(IContentService contentService, IMediaService mediaService, IOptions<ContentSettings> contentSettings, MediaUrlGeneratorCollection mediaUrlGenerators)
        {
            // special case, we need to update documents 3cce2545-e3ac-44ec-bf55-a52cc5965db3 and 72346384-fc5e-4a6e-a07d-559eec11dcea
            // to deal with the grid media value path that will be changed

            var media = mediaService.GetById(Guid.Parse("c0969cab13ab4de9819a848619ac2b5d"));

            var aboutUs = contentService.GetById(Guid.Parse("3cce2545-e3ac-44ec-bf55-a52cc5965db3"));
            var gridVal = JsonConvert.DeserializeObject<GridValue>((string)aboutUs.Properties["bodyText"].GetValue());
            var mediaItem = gridVal
                .Sections
                .SelectMany(x => x.Rows)
                .Where(x => x.Name == "Article")
                .SelectMany(x => x.Areas)
                .SelectMany(x => x.Controls)
                .First(x => x.Editor.Alias == "media");
            mediaItem.Value = JObject.FromObject(new
            {
                udi = media.GetUdi().ToString(),
                image = media.GetUrls(contentSettings.Value, mediaUrlGenerators).First()
            });
            aboutUs.SetValue("bodyText", JsonConvert.SerializeObject(gridVal));
            contentService.Save(aboutUs);

            var anotherOne = contentService.GetById(Guid.Parse("72346384-fc5e-4a6e-a07d-559eec11dcea"));
            media = mediaService.GetById(Guid.Parse("55514845b8bd487cb3709724852fd6bb"));
            gridVal = JsonConvert.DeserializeObject<GridValue>((string)anotherOne.Properties["bodyText"].GetValue());
            mediaItem = gridVal
                .Sections
                .SelectMany(x => x.Rows)
                .Where(x => x.Name == "Article")
                .SelectMany(x => x.Areas)
                .SelectMany(x => x.Controls)
                .First(x => x.Editor.Alias == "media");
            mediaItem.Value = JObject.FromObject(new
            {
                udi = media.GetUdi().ToString(),
                image = media.GetUrls(contentSettings.Value, mediaUrlGenerators).First()
            });
            anotherOne.SetValue("bodyText", JsonConvert.SerializeObject(gridVal));
            contentService.Save(anotherOne);
        }

        private int CreateMediaItem(IMediaService service, IMediaTypeService mediaTypeService,
            int parentFolderId, string nodeTypeAlias, Guid key, string nodeName, string mediaPath, bool checkForDuplicateName = false)
        {
            //if the item with the exact id exists we cannot install it (the package was probably already installed)
            if (service.GetById(key) != null)
                return -1;

            //cannot continue if the media type doesn't exist
            var mediaType = mediaTypeService.Get(nodeTypeAlias);
            if (mediaType == null)
            {
                _logger.LogWarning("Could not create media, the {NodeTypeAlias} media type is missing, the Starter Kit package will not function correctly", nodeTypeAlias);
                return -1;
            }

            var isDuplicate = false;

            if (checkForDuplicateName)
            {
                IEnumerable<IMedia> children;
                if (parentFolderId == -1)
                {
                    children = service.GetRootMedia();
                }
                else
                {
                    var parentFolder = service.GetById(parentFolderId);
                    if (parentFolder == null)
                    {
                        _logger.LogWarning("No media parent found by Id {ParentFolderId} the media item {NodeName} cannot be installed", parentFolderId, nodeName);
                        return -1;
                    }

                    children = service.GetPagedChildren(parentFolderId, 0, int.MaxValue, out long totalRecords);
                }
                foreach (var m in children)
                {
                    if (m.Name == nodeName)
                    {
                        isDuplicate = true;
                        break;
                    }
                }
            }

            if (isDuplicate) return -1;

            if (parentFolderId != -1)
            {
                var parentFolder = service.GetById(parentFolderId);
                if (parentFolder == null)
                {
                    _logger.LogWarning("No media parent found by Id {ParentFolderId} the media item {NodeName} cannot be installed", parentFolderId, nodeName);
                    return -1;
                }
            }

            var media = service.CreateMedia(nodeName, parentFolderId, nodeTypeAlias);
            
            if (nodeTypeAlias != "folder")
            {
                var fileName = Path.GetFileName(mediaPath);
                var fileInfo = new FileInfo(fileName);
                var fileStream = fileInfo.OpenReadWithRetry();
                if (fileStream == null) throw new InvalidOperationException("Could not acquire file stream");
                using (fileStream)
                {
                    //TODO: Check if this works also with Blob Storage file provider
                    media.SetValue(_mediaFileSystem, _shortStringHelper, _contentTypeBaseServiceProvider, _serializer, "umbracoFile", fileName, fileStream);
                }   
            }
                
            if (key != Guid.Empty)
            {
                media.Key = key;
            }
            service.Save(media);
            return media.Id;
        }
    }
}
