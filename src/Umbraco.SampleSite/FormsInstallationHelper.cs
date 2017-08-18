using System;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Umbraco.Core.Services;

namespace Umbraco.SampleSite
{
    public class FormsInstallationHelper
    {
        private readonly ServiceContext _services;

        private static readonly Regex PreInstallContactFormHtmlPattern = new Regex(@"@Umbraco\.RenderMacro\(\""renderUmbracoForm\""\,[\.\w\{\}\=\(\)\s]+\)", RegexOptions.Compiled);
        private static string PreInstallContactFormHtml = "@Umbraco.RenderMacro(\"renderUmbracoForm\", new { FormGuid = Model.Content.ContactForm.ToString() })";

        private static readonly Regex PostInstallContactFormHtmlPattern = new Regex(@"\<p class=\""compat-msg\""\>.+?\<\/p\>", RegexOptions.Compiled | RegexOptions.Singleline);
        private static string PostInstallContactFormHtml = @"<p class=""compat-msg"">
        <em>Umbraco Forms</em> is required to render this form.It's a breeze to install, all you have to do is
        go to the<em> Umbraco Forms</em> section in the back office and click Install, that's it! :) 
        <br /><br />
        <a href=""/umbraco/#/forms"" class=""button button--border--solid"">Go to Back Office and install Forms</a>
        <!-- When Umbraco Forms is installed, uncomment this line -->
        @* @Umbraco.RenderMacro(""renderUmbracoForm"", new {FormGuid=Model.Content.ContactForm.ToString()}) *@
        </p>";

        public FormsInstallationHelper(ServiceContext services)
        {
            if (services == null) throw new ArgumentNullException(nameof(services));
            _services = services;
        }

        /// <summary>
        /// This will check if Forms is installed and if not it will update the markup in the contact template to render a message to install forms
        /// and update the contactForm property type to become a label
        /// </summary>        
        public void UpdateUmbracoDataForNonFormsInstallation()
        {
            var macroService = _services.MacroService;
            var doctypeService = _services.ContentTypeService;
            var dataTypeService = _services.DataTypeService;
            var fileService = _services.FileService;

            // check if forms is installed
            var formMacro = macroService.GetByAlias("renderUmbracoForm");
            if (formMacro == null)
            {
                // find the doctype and change the form chooser property type

                var contactFormType = doctypeService.GetContentType("contact");
                if (contactFormType != null)
                {
                    var formPicker = contactFormType.PropertyTypes.FirstOrDefault(x => x.Alias == "contactForm");
                    var labelDataType = dataTypeService.GetDataTypeDefinitionByPropertyEditorAlias("Umbraco.NoEdit")
                        .First();
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
                        templateContent =
                            PreInstallContactFormHtmlPattern.Replace(templateContent, PostInstallContactFormHtml);

                        contactView.Content = templateContent;
                        fileService.SaveTemplate(contactView);
                    }
                }

            }
            else
            {
                // form is installed
                CheckForDeployFile();
            }
        }

        /// <summary>
        /// This will check if Forms is installed and if so it will update the markup in the contact template to render the form
        /// and update the contactForm property type to become a form picker
        /// </summary>        
        public void UpdateUmbracoDataForFormsInstallation()
        {
            var macroService = _services.MacroService;
            var doctypeService = _services.ContentTypeService;
            var dataTypeService = _services.DataTypeService;
            var fileService = _services.FileService;

            // check if forms is installed
            var formMacro = macroService.GetByAlias("renderUmbracoForm");
            if (formMacro != null)
            {
                // find the doctype and change the form chooser property type

                var contactFormType = doctypeService.GetContentType("contact");
                if (contactFormType != null)
                {
                    var formPicker = contactFormType.PropertyTypes.FirstOrDefault(x => x.Alias == "contactForm");
                    var formPickerDataType = dataTypeService.GetDataTypeDefinitionByPropertyEditorAlias("UmbracoForms.FormPicker").First();
                    if (formPickerDataType != null && formPicker != null)
                    {
                        formPicker.DataTypeDefinitionId = formPickerDataType.Id;
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
                        templateContent = PostInstallContactFormHtmlPattern.Replace(templateContent, PreInstallContactFormHtml);

                        contactView.Content = templateContent;
                        fileService.SaveTemplate(contactView);
                    }
                }

                CheckForDeployFile();
            }
        }

        private static void CheckForDeployFile()
        {
// copy the uda file if a data folder exist
            var deployRevisionDirPath =
                Core.IO.IOHelper.MapPath("~/data" + Core.IO.IOHelper.DirSepChar + "revision");
            var formsMarkerFile = "forms-form__adf160f139f544c0b01d9e2da32bf093.uda";
            var formsTempDirectory = Core.IO.IOHelper.MapPath(Core.IO.SystemDirectories.Data + Core.IO.IOHelper.DirSepChar + "TEMP");
            if (Directory.Exists(deployRevisionDirPath) &&
                File.Exists(deployRevisionDirPath + Core.IO.IOHelper.DirSepChar + formsMarkerFile) == false)
            {
                // copy the file
                if (File.Exists(formsTempDirectory + Core.IO.IOHelper.DirSepChar + formsMarkerFile))
                {
                    File.Copy(formsTempDirectory + Core.IO.IOHelper.DirSepChar + formsMarkerFile,
                        deployRevisionDirPath + Core.IO.IOHelper.DirSepChar + formsMarkerFile, true);
                }
            }
        }
    }
}