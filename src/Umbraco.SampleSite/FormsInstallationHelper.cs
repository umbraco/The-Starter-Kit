using System;
using System.Collections.Concurrent;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
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
                CreateFormsDefinition();
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

                CreateFormsDefinition();
            }
        }

        private static void CreateFormsDefinition()
        {
            var formsAssembly = Assembly.Load("Umbraco.Forms.Core");
            if (formsAssembly == null)
                throw new InvalidOperationException("Could not load assembly Umbraco.Forms.Core");
            var formsType = formsAssembly.GetType("Umbraco.Forms.Core.Form");
            if (formsType == null) 
                throw new InvalidOperationException("Could not find type Umbraco.Forms.Core.Form in assembly " + formsAssembly);

            //deserialize the form from the json file
            var form = JsonConvert.DeserializeObject(FormsDefinitions.ContactForm, formsType);

            var formsStorageType = formsAssembly.GetType("Umbraco.Forms.Data.Storage");
            if (formsStorageType == null)
                throw new InvalidOperationException("Could not find type Umbraco.Forms.Data.Storage in assembly " + formsAssembly);

            //create a FormsStorage instance and Insert it, then dispose the FormsStorage
            var formsStorageInstance = Activator.CreateInstance(formsStorageType);
            try
            {
                CallMethod(formsStorageInstance, "InsertForm", form);
            }
            finally
            {
                if (formsStorageInstance != null)
                {
                    CallMethod(formsStorageInstance, "Dispose");
                }
            }
        }


        #region Reflection Helpers
        private static object CallMethod(object obj, string methodName, params object[] parameters)
        {
            if (obj == null)
                throw new ArgumentNullException(nameof(obj));
            var type = obj.GetType();
            var methodInfo = GetMethodInfo(type, methodName);
            if (methodInfo == null)
                throw new ArgumentOutOfRangeException(nameof(methodName), $"Couldn't find method {methodName} in type {type.FullName}");
            return methodInfo.Invoke(obj, parameters);
        }

        private static MethodInfo GetMethodInfo(Type type, string methodName)
        {
            if (type == null)
                throw new ArgumentNullException(nameof(type));
            if (string.IsNullOrWhiteSpace(methodName))
                throw new ArgumentException("Value cannot be null or whitespace.", nameof(methodName));
            return MethodInfoCache.GetOrAdd(new Tuple<Type, string>(type, methodName), tuple =>
            {
                MethodInfo method;
                do
                {
                    method = type.GetMethod(methodName, BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic);
                    type = type.BaseType;
                }
                while (method == null && type != null);
                return method;
            });
        }

        private static readonly ConcurrentDictionary<Tuple<Type, string>, MethodInfo> MethodInfoCache = new ConcurrentDictionary<Tuple<Type, string>, MethodInfo>(); 
        #endregion
    }
}