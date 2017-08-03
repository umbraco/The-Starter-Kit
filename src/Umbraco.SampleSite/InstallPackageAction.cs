using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Xml;
using umbraco.interfaces;
using Umbraco.Core;
using Umbraco.Core.Logging;
using Umbraco.Core.Models;
using Umbraco.Core.Services;

namespace Umbraco.SampleSite
{
    public class InstallPackageAction : IPackageAction
    {
        public static Regex PreInstallContactFormHtmlPattern = new Regex(@"@Umbraco\.RenderMacro\(\""renderUmbracoForm\""\,[\.\w\{\}\=\(\)\s]+\)", RegexOptions.Compiled);
        public static string PreInstallContactFormHtml = "@Umbraco.RenderMacro(\"renderUmbracoForm\", new { FormGuid = Model.Content.ContactForm.ToString() })";

        public static Regex PostInstallContactFormHtmlPattern = new Regex(@"\<p class=\""compat-msg\""\>.+?\<\/p\>", RegexOptions.Compiled | RegexOptions.Singleline);
        public static string PostInstallContactFormHtml = @"<p class=""compat-msg"">
        <em>Umbraco Forms</em> is required to render this form.It's a breeze to install, all you have to do is
        go to the<em> Umbraco Forms</em> section in the back office and click Install, that's it! :) 
        <br /><br />
        <a href=""/umbraco/#/forms"" class=""button button--border--solid"">Go to Back Office and install Forms</a>
        <!-- When Umbraco Forms is installed, uncomment this line -->
        @* @Umbraco.RenderMacro(""renderUmbracoForm"", new {FormGuid=Model.Content.ContactForm.ToString()}) *@
        </p>";

        public bool Execute(string packageName, XmlNode xmlData)
        {
            var contentService = ApplicationContext.Current.Services.ContentService;
            var mediaService = ApplicationContext.Current.Services.MediaService;
            var dataTypeService = ApplicationContext.Current.Services.DataTypeService;
            var macroService = ApplicationContext.Current.Services.MacroService;
            var fileService = ApplicationContext.Current.Services.FileService;
            var doctypeService = ApplicationContext.Current.Services.ContentTypeService;
            
            // check if forms is installed
            var formMacro = macroService.GetByAlias("renderUmbracoForm");
            if (formMacro == null)
            {
                // find the doctype and change the form chooser property type
                
                var contactFormType = doctypeService.GetContentType("contact");
                if (contactFormType != null)
                {
                    var formPicker = contactFormType.PropertyTypes.FirstOrDefault(x => x.Alias == "contactForm");
                    var labelDataType = dataTypeService.GetDataTypeDefinitionByName("Label");
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
                        //do the replacement
                        templateContent = PreInstallContactFormHtmlPattern.Replace(templateContent, PostInstallContactFormHtml);
                        
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
            this.CreateMediaItem(mediaService, -1, "folder", new Guid("b6f11172-373f-4473-af0f-0b0e5aefd21c"), "Design", string.Empty, true);
            this.CreateMediaItem(mediaService, -1, "folder", new Guid("1fd2ecaf-f371-4c00-9306-867fa4585e7a"), "People", string.Empty, true);
            this.CreateMediaItem(mediaService, -1, "folder", new Guid("6d5bf746-cb82-45c5-bd15-dd3798209b87"), "Products", string.Empty, true);

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
                        
                        int mediaItem = CreateMediaItem(mediaService, media1.Id, "image", key, selectNode.Attributes["name"].Value, selectNode.Attributes["path"].Value, false);
                    }
                }
            }
            catch (Exception ex)
            {
                LogHelper.Error<InstallPackageAction>("Error during post processing of Starter Kit", ex);
            }

            if (contentHome != null)
            {
                // publish everything (moved here due to Deploy dependency checking)
                contentService.PublishWithChildrenWithStatus(contentHome, 0, true);
            }

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

        private int GetPreValueId(IDataTypeService dts, string dataTypeName, string preValueText)
        {
            IDataTypeDefinition dataTypeDefinition = dts.GetAllDataTypeDefinitions().First<IDataTypeDefinition>((Func<IDataTypeDefinition, bool>)(x => x.Name == dataTypeName));
            return dts.GetPreValuesCollectionByDataTypeId(dataTypeDefinition.Id).PreValuesAsDictionary.Where(d => d.Value.Value == preValueText).Select(f => f.Value.Id).First();
        }

        private int CreateMediaItem(IMediaService service, int parentFolder, string nodeTypeAlias, Guid key, string nodeName, string mediaPath, bool checkForDuplicate = false)
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
