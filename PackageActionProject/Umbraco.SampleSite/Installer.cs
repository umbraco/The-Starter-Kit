using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml;
using umbraco;
using Umbraco.Core;
using Umbraco.Core.Models;
using Umbraco.Core.Services;
using umbraco.interfaces;
using umbraco.NodeFactory;
using Umbraco.Core.Logging;

namespace Umbraco.SampleSite.Installer
{
    public class InstallPackageAction : IPackageAction
    {
        public static string PRE_INSTALL_CONTACT_FORM_HTML = "@Umbraco.RenderMacro(\"renderUmbracoForm\", new {FormGuid=Model.Content.ContactForm.ToString()})";
        public static string POST_INSTALL_CONTACT_FORM_HTML = "<p>You can get a contact form appearing here by installing Umbraco Forms.<br /> <a href=\"/umbraco/#/forms\" class=\"button button--border--solid\">Go to Back Office and install Forms</a>" + Environment.NewLine + "<!-- When Umbraco Forms is installed, uncomment this line -->" + Environment.NewLine + "@* @Umbraco.RenderMacro(\"renderUmbracoForm\", new {FormGuid=Model.Content.ContactForm.ToString()}) *@";
        public bool Execute(string packageName, XmlNode xmlData)
        {
            var contentService = ApplicationContext.Current.Services.ContentService;
            var mediaService = ApplicationContext.Current.Services.MediaService;
            var dataTypeService = ApplicationContext.Current.Services.DataTypeService;
            var macroService = ApplicationContext.Current.Services.MacroService;
            var fileService = ApplicationContext.Current.Services.FileService;


            IMedia mediaRoot = mediaService.GetById(-1);
            IContent contentHome = contentService.GetRootContent().FirstOrDefault<IContent>();

            // check if forms is installed
            var formMacro = macroService.GetByAlias("renderUmbracoForm");
            if (formMacro == null)
            {
                // find the doctype and change the form chooser property type
                var doctypeService = ApplicationContext.Current.Services.ContentTypeService;
                var contactFormType = doctypeService.GetContentType("contact");
                if (contactFormType != null)
                {
                    var formPicker = contactFormType.PropertyTypes.FirstOrDefault(x => x.Alias == "contactForm");
                    var labelDataType = dataTypeService.GetAllDataTypeDefinitions().First<IDataTypeDefinition>(x => x.Name == "Label");
                    if (labelDataType != null && formPicker != null)
                    {
                        formPicker.DataTypeDefinitionId = labelDataType.Id;
                        doctypeService.Save(contactFormType);
                    }
                }

                // update the template
                var contactView = fileService.GetTemplate("contact");
                if (contactView != null)
                {
                    var templateContent = contactView.Content;
                    if (string.IsNullOrWhiteSpace(templateContent) == false)
                    {
                        templateContent = templateContent.Replace(PRE_INSTALL_CONTACT_FORM_HTML, POST_INSTALL_CONTACT_FORM_HTML);
                        contactView.Content = templateContent;
                        fileService.SaveTemplate(contactView);
                    }
                }
            }

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
            // update default design 
            contentHome.SetValue("colorTheme", getPreValueId(dataTypeService, "Home - Color Theme - Radio button list", "earth"));
            contentHome.SetValue("font", getPreValueId(dataTypeService, "Home - Font - Radio button list", "serif"));

            // update default currency pre value
            IContent productContent = contentService.GetById(new Guid("485343b1-d99c-4789-a676-e9b4c98a38d4"));
            productContent.SetValue("defaultCurrency", (object)this.getPreValueId(dataTypeService, "Products - Default Currency - Dropdown list", "€"));

            // create media folders
            this.createMediaItem(mediaService, -1, "folder", new Guid("b6f11172-373f-4473-af0f-0b0e5aefd21c"), "Design", string.Empty, true);
            this.createMediaItem(mediaService, -1, "folder", new Guid("1fd2ecaf-f371-4c00-9306-867fa4585e7a"), "People", string.Empty, true);
            this.createMediaItem(mediaService, -1, "folder", new Guid("6d5bf746-cb82-45c5-bd15-dd3798209b87"), "Products", string.Empty, true);

            // create media
            IEnumerable<IMedia> rootMedia = mediaService.GetRootMedia();
            try
            {
                if (xmlData.HasChildNodes)
                {
                    foreach (XmlNode selectNode in xmlData.SelectNodes("./mediaItem"))
                    {
                        IMedia media1 = mediaRoot;
                        foreach (IMedia media2 in rootMedia)
                        {
                            if (media2.Name.ToLower() == selectNode.Attributes["folder"].Value.ToLower())
                                media1 = media2;
                        }

                        // add UDI support
                        var key = selectNode.Attributes["key"] != null &&
                            string.IsNullOrWhiteSpace(selectNode.Attributes["key"].Value) == false
                            ? Guid.Parse(selectNode.Attributes["key"].Value)
                            : Guid.Empty;
                        int mediaItem = createMediaItem(mediaService, media1.Id, "image", key, selectNode.Attributes["name"].Value, selectNode.Attributes["path"].Value, false);
                    }
                }
            }
            catch (Exception ex)
            {
                LogHelper.Error<InstallPackageAction>("Error during post processing of Starter Kit", ex);
            }

            // publish everything (moved here due to Deploy dependency checking
            contentService.PublishWithChildrenWithStatus(contentHome, 0, true);

            return true;
        }

        public string Alias()
        {
            return "SampleSiteInitialContent";
        }

        public bool Undo(string packageName, XmlNode xmlData)
        {
            return false;
        }

        public XmlNode SampleXml()
        {
            return umbraco.cms.businesslogic.packager.standardPackageActions.helper.parseStringToXmlNode("<Action runat=\"install\" undo=\"false\" alias=\"SampleSiteInitialContent\"><mediaItem folder=\"\" name=\"\" path=\"\" updateDocPath=\"\" updatePropertyAlias=\"\" /></Action>");
        }

        private int getPreValueId(IDataTypeService dts, string dataTypeName, string preValueText)
        {
            IDataTypeDefinition dataTypeDefinition = dts.GetAllDataTypeDefinitions().First<IDataTypeDefinition>((Func<IDataTypeDefinition, bool>)(x => x.Name == dataTypeName));
            return dts.GetPreValuesCollectionByDataTypeId(dataTypeDefinition.Id).PreValuesAsDictionary.Where<KeyValuePair<string, PreValue>>((Func<KeyValuePair<string, PreValue>, bool>)(d => d.Value.Value == preValueText)).Select<KeyValuePair<string, PreValue>, int>((Func<KeyValuePair<string, PreValue>, int>)(f => f.Value.Id)).First<int>();
        }

        private int createMediaItem(IMediaService service, int parentFolder, string nodeTypeAlias, Guid key, string nodeName, string mediaPath, bool checkForDuplicate = false)
        {
            bool flag = false;
            IMedia media1 = (IMedia)null;
            if (checkForDuplicate)
            {
                foreach (IMedia media2 in parentFolder == -1 ? service.GetRootMedia() : service.GetById(parentFolder).Children())
                {
                    if (media2.Name == nodeName)
                    {
                        media1 = media2;
                        flag = true;
                        break;
                    }
                }
            }
            if (!flag)
            {
                media1 = service.CreateMedia(nodeName, parentFolder, nodeTypeAlias, 0);
                if (nodeTypeAlias != "folder")
                    media1.SetValue("umbracoFile", (object)mediaPath);
                if (key != Guid.Empty)
                {
                    media1.Key = key;
                }
                service.Save(media1, 0, true);
            }
            return media1.Id;
        }
    }
}
