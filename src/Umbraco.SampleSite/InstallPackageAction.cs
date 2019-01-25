using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml;
using System.Xml.Linq;
using Newtonsoft.Json;
using Umbraco.Core;
using Umbraco.Core._Legacy.PackageActions;
using Umbraco.Core.Logging;
using Umbraco.Core.Models;
using Umbraco.Core.Services;
using Umbraco.Web._Legacy.PackageActions;
using Umbraco.Web.Composing;

namespace Umbraco.SampleSite
{
    public class InstallPackageAction : IPackageAction
    {
        public bool Execute(string packageName, XmlNode xmlData)
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
                foreach (var template in fileService.GetTemplates())
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

            var contentHome = contentService.GetRootContent().FirstOrDefault(x => x.ContentType.Alias == "home");
            if (contentHome != null)
            {
                // update default design 
                contentHome.SetValue("colorTheme", GetPreValueId(dataTypeService, "Home - Color Theme - Radio button list", "earth"));
                contentHome.SetValue("font", GetPreValueId(dataTypeService, "Home - Font - Radio button list", "serif"));
                contentService.Save(contentHome);
            }

            // update default currency pre value
            IContent productContent = contentService.GetById(new Guid("485343b1-d99c-4789-a676-e9b4c98a38d4"));
            if (productContent != null)
            {
                productContent.SetValue("defaultCurrency", GetPreValueId(dataTypeService, "Products - Default Currency - Dropdown list", "€"));
                contentService.Save(productContent);
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
                if (xmlData.HasChildNodes)
                {
                    foreach (XmlNode selectNode in xmlData.SelectNodes("./mediaItem"))
                    {
                        IMedia media1 = mediaRoot;
                        foreach (IMedia media2 in rootMedia)
                        {
                            if (media2.Name.InvariantEquals(selectNode.Attributes["folder"].Value))
                                media1 = media2;
                        }

                        // add UDI support
                        var key = selectNode.Attributes["key"] != null &&
                                  string.IsNullOrWhiteSpace(selectNode.Attributes["key"].Value) == false
                            ? Guid.Parse(selectNode.Attributes["key"].Value)
                            : Guid.Empty;

                        int mediaItem = CreateMediaItem(mediaService, mediaTypeService, media1.Id, "image", key, selectNode.Attributes["name"].Value, selectNode.Attributes["path"].Value, false);
                    }
                }
            }
            catch (Exception ex)
            {
                Current.Logger.Error<InstallPackageAction>(ex, "Error during post processing of Starter Kit");
            }

            // we need to update the references for the photo used in the grid in a blog post and about us page
            ReplaceMediaGridValues(new Guid("a4174f42-86fb-47ee-a376-c3366597c5fc"), new Guid("208abda1-63b5-4ba1-bc2a-3d40fe156bb6"), "BlogPost", contentService, mediaService);
            ReplaceMediaGridValues(new Guid("d62f0f1d-e4a9-4093-94ae-4efce18872ee"), new Guid("981014a4-f0b9-46db-aa91-87cf2027f6e0"), "AboutUs", contentService, mediaService);

            if (contentHome != null)
            {
                // publish everything (moved here due to Deploy dependency checking)
                contentService.SaveAndPublishBranch(contentHome, true);
            }

            return true;
        }

        private static void ReplaceMediaGridValues(Guid contentGuid, Guid mediaGuid, string searchForKey, IContentService contentService, IMediaService mediaService)
        {
            var contentItem = contentService.GetById(contentGuid);
            var mediaItem = mediaService.GetById(mediaGuid);
            if (contentItem != null && mediaItem != null)
            {
                var blogGridContent = contentItem.GetValue<string>("bodyText");
                var bikerJacketPath = mediaItem.GetValue<string>("umbracoFile");
                // check if the path is in json
                if (bikerJacketPath.Contains("{"))
                {
                    // we need to parse the media path from the json
                    var def = new {Src = "", Crops = new string[] {""}};
                    var mediaJson = JsonConvert.DeserializeAnonymousType(bikerJacketPath, def);
                    bikerJacketPath = mediaJson.Src;
                }
                var bikerJacketId = mediaItem.Id.ToString();

                blogGridContent = blogGridContent.Replace($"#pathToMediaIn{searchForKey}", bikerJacketPath)
                    .Replace($"#mediaIdIn{searchForKey}", bikerJacketId);

                contentItem.SetValue("bodyText", blogGridContent);
                contentService.Save(contentItem);
            }
        }

        public bool Execute(string packageName, XElement xmlData)
        {
            throw new NotImplementedException();
        }

        public string Alias()
        {
            return "SampleSiteInitialContent";
        }

        public bool Undo(string packageName, XElement xmlData)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// This occurs on package uninstall
        /// </summary>
        /// <param name="packageName"></param>
        /// <param name="xmlData"></param>
        /// <returns>
        /// The return value doesn't make any difference
        /// </returns>
        public bool Undo(string packageName, XmlNode xmlData)
        {
            //see https://github.com/umbraco/7.6-Starter-Kit/issues/26 - perhaps it's not a good idea to remove the form
            //FormsInstallationHelper.RemoveStarterKitForm();
            return true;
        }

        public XmlNode SampleXml()
        {
            throw new NotImplementedException();
        }

        private int GetPreValueId(IDataTypeService dts, string dataTypeName, string preValueText)
        {
            //var dataTypeDefinition = dts.GetAll().First<IDataType>((Func<IDataType, bool>)(x => x.Name == dataTypeName));
            var dataTypeDefinition = dts.GetDataType(dataTypeName);
            
            //TODO V8: How do we do this?!
            //return dts.GetPreValuesCollectionByDataTypeId(dataTypeDefinition.Id).PreValuesAsDictionary.Where(d => d.Value.Value == preValueText).Select(f => f.Value.Id).First();
            return -1;
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
                media.SetValue("umbracoFile", mediaPath);
            if (key != Guid.Empty)
            {
                media.Key = key;
            }
            service.Save(media);
            return media.Id;
        }
    }
}
