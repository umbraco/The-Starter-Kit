using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml;
using System.Xml.Linq;
using Newtonsoft.Json;
using Umbraco.Core;
using Umbraco.Core.Logging;
using Umbraco.Core.Models;
using Umbraco.Core.PackageActions;
using Umbraco.Core.PropertyEditors.ValueConverters;
using Umbraco.Core.Services;
using Umbraco.Web.Composing;

namespace Umbraco.SampleSite
{
    public class InstallPackageAction : IPackageAction
    {
        public bool Execute(string packageName, XElement xmlData)
        {
            var contentService = Current.Services.ContentService;
            var mediaTypeService = Current.Services.MediaTypeService;
            var mediaService = Current.Services.MediaService;
            var dataTypeService = Current.Services.DataTypeService;
            var fileService = Current.Services.FileService;

            var formsInstallHelper = new FormsInstallationHelper(Current.Services);
            formsInstallHelper.UpdateUmbracoDataForNonFormsInstallation();

            // update master view for all templates (packager doesn't support this)
            var master = fileService.GetTemplate("master");
            if (master != null)
            {
                var templatesToFind = new[] { "Blog", "Blogpost", "contact", "contentPage", "home", "people", "Person", "Product", "Products" };
                foreach (var template in fileService.GetTemplates().Where(x => templatesToFind.InvariantContains(x.Alias)))
                {
                    // we'll update the master template for all templates that doesn't have one already
                    if (template.Alias != master.Alias && (
                            template.IsMasterTemplate == false && string.IsNullOrWhiteSpace(template.MasterTemplateAlias)))
                    {
                        template.SetMasterTemplate(master);
                        fileService.SaveTemplate(template);
                    }
                }
            }

            // create media folders

            this.CreateMediaItem(mediaService, mediaTypeService, -1, "folder", new Guid("b6f11172-373f-4473-af0f-0b0e5aefd21c"), "Design", string.Empty, true);
            this.CreateMediaItem(mediaService, mediaTypeService, -1, "folder", new Guid("1fd2ecaf-f371-4c00-9306-867fa4585e7a"), "People", string.Empty, true);
            this.CreateMediaItem(mediaService, mediaTypeService, -1, "folder", new Guid("6d5bf746-cb82-45c5-bd15-dd3798209b87"), "Products", string.Empty, true);

            // create media
            IMedia mediaRoot = mediaService.GetById(-1);
            IEnumerable<IMedia> rootMedia = mediaService.GetRootMedia().ToArray();
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

                    int mediaItem = CreateMediaItem(mediaService, mediaTypeService, media1.Id, "image", key, (string)selectNode.Attribute("name"), (string)selectNode.Attribute("path"), false);
                }
            }
            catch (Exception ex)
            {
                Current.Logger.Error<InstallPackageAction>(ex, "Error during post processing of Starter Kit");
            }

            var contentHome = contentService.GetRootContent().FirstOrDefault(x => x.ContentType.Alias == "home");
            if (contentHome != null)
            {
                // publish everything (moved here due to Deploy dependency checking)
                contentService.SaveAndPublishBranch(contentHome, true);
            }
            else
            {
                Current.Logger.Warn<InstallPackageAction>("The installed Home page was not found");
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
                Current.Logger.Warn<InstallPackageAction>("Could not create media, the {NodeTypeAlias} media type is missing, the Starter Kit package will not function correctly", nodeTypeAlias);
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
                        Current.Logger.Warn<InstallPackageAction>("No media parent found by Id {ParentFolderId} the media item {NodeName} cannot be installed", parentFolderId, nodeName);
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
                    Current.Logger.Warn<InstallPackageAction>("No media parent found by Id {ParentFolderId} the media item {NodeName} cannot be installed", parentFolderId, nodeName);
                    return -1;
                }
            }

            var media = service.CreateMedia(nodeName, parentFolderId, nodeTypeAlias);
            if (nodeTypeAlias != "folder")
                media.SetValue("umbracoFile", JsonConvert.SerializeObject(new ImageCropperValue { Src = mediaPath }));
            if (key != Guid.Empty)
            {
                media.Key = key;
            }
            service.Save(media,-1);
            return media.Id;
        }
    }
}
