using System;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Umbraco.Core;
using Umbraco.Core.Services;

namespace Umbraco.SampleSite
{
    public class FormsInstallationHelper
    {
        private readonly IMacroService _macroService;
        private readonly IContentTypeService _contentTypeService;
        private readonly IDataTypeService _dataTypeService;
        private readonly IFileService _fileService;
        private readonly ILogger<FormsInstallationHelper> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;


        private static readonly Regex PreInstallContactFormHtmlPattern = new Regex(@"@Umbraco\.RenderMacro\(\""renderUmbracoForm\""\,[\.\w\{\}\=\(\)\s]+\)", RegexOptions.Compiled);
        private static string PreInstallContactFormHtml = "@Umbraco.RenderMacro(\"renderUmbracoForm\", new { FormGuid = Model.ContactForm.ToString(), ExcludeScripts=\"0\" })";
        private static Guid ContactFormId = new Guid("adf160f1-39f5-44c0-b01d-9e2da32bf093");
        
        
        private static readonly Regex PostInstallContactFormHtmlPattern = new Regex(@"\<p class=\""compat-msg\""\>.+?\<\/p\>", RegexOptions.Compiled | RegexOptions.Singleline);
        private static string PostInstallContactFormHtml = @"<p class=""compat-msg"">
        <em>Umbraco Forms</em> is required to render this form.It's a breeze to install, all you have to do is
        go to the<em> Umbraco Forms</em> section in the back office and click Install, that's it! :) 
        <br /><br />
        <a href=""/umbraco/#/forms"" class=""button button--border--solid"">Go to Back Office and install Forms</a>
        <!-- When Umbraco Forms is installed, uncomment this line -->
        @* @Umbraco.RenderMacro(""renderUmbracoForm"", new {FormGuid=Model.ContactForm.ToString()}) *@
        </p>";

        private const string DocTypeAlias = "contact";
        private const string PropertyAlias = "contactForm";
        private const string TemplateAlias = "contact";        
        private const string FormDataTypeAlias = "UmbracoForms.FormPicker";
        private const string FormsMacroAlias = "renderUmbracoForm";

        public FormsInstallationHelper(IMacroService macroService, IContentTypeService contentTypeService,
            IDataTypeService dataTypeService, IFileService fileService, ILogger<FormsInstallationHelper> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _macroService = macroService;
            _contentTypeService = contentTypeService;
            _dataTypeService = dataTypeService;
            _fileService = fileService;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        /// <summary>
        /// This will check if Forms is installed and if not it will update the markup in the contact template to render a message to install forms
        /// and update the contactForm property type to become a label
        /// </summary>        
        public void UpdateUmbracoDataForNonFormsInstallation()
        {
            // check if forms is installed
            var formMacro = _macroService.GetByAlias(FormsMacroAlias);
            if (formMacro == null)
            {
                // find the doctype and change the form chooser property type

                var contactFormType = _contentTypeService.Get(DocTypeAlias);
                if (contactFormType != null)
                {
                    var formPicker = contactFormType.PropertyTypes.FirstOrDefault(x => x.Alias == PropertyAlias);

                    var labelDataType = _dataTypeService.GetDataType(Constants.DataTypes.LabelString);
                    if (labelDataType != null && formPicker != null)
                    {
                        formPicker.DataTypeId = labelDataType.Id;
                        _contentTypeService.Save(contactFormType);
                    }
                }

                // update the template
                var contactView = _fileService.GetTemplate(TemplateAlias);
                if (contactView != null)
                {
                    var templateContent = contactView.Content;
                    if (string.IsNullOrWhiteSpace(templateContent) == false)
                    {
                        // do the replacement
                        templateContent =
                            PreInstallContactFormHtmlPattern.Replace(templateContent, PostInstallContactFormHtml);

                        contactView.Content = templateContent;
                        _fileService.SaveTemplate(contactView);
                    }
                }

            }
            else
            {
                // forms is installed
                var formsInstallHelper = new FormsInstallationHelper(_macroService, _contentTypeService, _dataTypeService, _fileService, _logger, _httpContextAccessor);
                formsInstallHelper.UpdateUmbracoDataForFormsInstallation();
            }
        }

        /// <summary>
        /// This will check if Forms is installed and if so it will update the markup in the contact template to render the form
        /// and update the contactForm property type to become a form picker
        /// </summary>        
        public void UpdateUmbracoDataForFormsInstallation()
        {
            // check if forms is installed
            var formMacro = _macroService.GetByAlias(FormsMacroAlias);
            if (formMacro != null)
            {
                // find the doctype and change the form chooser property type

                var contactFormType = _contentTypeService.Get(DocTypeAlias);
                if (contactFormType == null)
                {
                    _logger.LogWarning("Unable to find document type {DocTypeAlias} to update for Forms installation", DocTypeAlias);
                    return;
                }
                
                var formPicker = contactFormType.PropertyTypes.FirstOrDefault(x => x.Alias == PropertyAlias);
                if(formPicker == null)
                {
                    _logger.LogWarning("Unable to find property {PropertyAlias} on {DocTypeAlias} to update for Forms installation", PropertyAlias, DocTypeAlias);
                    return;
                }
                
                var formPickerDataType = _dataTypeService.GetByEditorAlias(FormDataTypeAlias).FirstOrDefault();
                if(formPickerDataType == null)
                {
                    _logger.LogWarning("Unable to find Data Type {DataTypeAlias} to update {PropertyAlias} on {DocTypeAlias} for Forms installation", FormDataTypeAlias, PropertyAlias, DocTypeAlias);
                    return;
                }

                if (formPickerDataType != null && formPicker != null)
                {
                    formPicker.DataTypeId = formPickerDataType.Id;
                    _contentTypeService.Save(contactFormType);
                }
                

                // update the template
                var contactView = _fileService.GetTemplate(TemplateAlias);
                if(contactView == null)
                {
                    _logger.LogWarning("Unable to find Template {TemplateAlias} for Forms installation", TemplateAlias);
                    return;
                }
                
                if (contactView != null)
                {
                    var templateContent = contactView.Content;
                    if (string.IsNullOrWhiteSpace(templateContent) == false)
                    {
                        //do the replacement
                        templateContent = PostInstallContactFormHtmlPattern.Replace(templateContent, PreInstallContactFormHtml);

                        contactView.Content = templateContent;
                        _fileService.SaveTemplate(contactView);
                    }
                }   

                CreateStarterKitForm();
            }
        }

        /// <summary>
        /// Will delete the form that is installed by the starter kit if it exists using reflection to invoke the forms API to do so
        /// </summary>
        /// <remarks>
        /// This will not throw any exceptions if the forms types are not found, it will just exit
        /// </remarks>
        public void RemoveStarterKitForm()
        {
            _logger.LogInformation("Deleting Form created from Starter Kit...");

            var formsAssembly = Assembly.Load("Umbraco.Forms.Core");
            if (formsAssembly == null) return;

            var formsType = formsAssembly.GetType("Umbraco.Forms.Core.Models.Form");
            if (formsType == null) return;

            var formsStorageType = formsAssembly.GetType("Umbraco.Forms.Core.Data.Storage.IFormStorage");
            if (formsStorageType == null) return;

            //create a FormsStorage instance
            object formsStorageInstance;
            try
            {
                formsStorageInstance = _httpContextAccessor.HttpContext.RequestServices.GetService(formsStorageType);
            }
            catch (Exception ex)
            {
                //If we cannot create it then there's nothing we can do
                _logger.LogError(ex, "Unable to get instance of Umbraco.Forms.Core.Data.Storage.IFormStorage from Container");
                return;
            }

            try
            {
                var form = CallMethod(formsStorageInstance, "GetForm", ContactFormId);
                if (form == null) return;

                var deleteResult = CallMethod(formsStorageInstance, "DeleteForm", form);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unable to call method DeleteForm on FormStorage");

                //If we cannot create it then there's nothing we can do
                return;
            }

            _logger.LogInformation("Deleted Form created from Starter Kit");
        }

        /// <summary>
        /// Creates a Form by importing it via a serialized version of the form and using reflection to invoke the forms API
        /// </summary>
        private void CreateStarterKitForm()
        {
            _logger.LogInformation("Creating Form for Starter Kit...");

            Assembly formsAssembly;
            try
            {
                formsAssembly = Assembly.Load("Umbraco.Forms.Core");
                if (formsAssembly == null)
                    throw new InvalidOperationException("Could not load assembly Umbraco.Forms.Core");
            }
            catch (Exception ex)
            {
                //forms assembly isn't there
                _logger.LogError(ex, "Unable to find the Assembly Umbraco.Forms.Core");
                return;
            }

            var formsType = formsAssembly.GetType("Umbraco.Forms.Core.Models.Form");
            if (formsType == null) 
                throw new InvalidOperationException("Could not find type Umbraco.Forms.Core.Models.Form in assembly " + formsAssembly);

            //deserialize the form from the json file
            var form = JsonConvert.DeserializeObject(FormsDefinitions.ContactForm, formsType);

            var formsStorageType = formsAssembly.GetType("Umbraco.Forms.Core.Data.Storage.IFormStorage");
            if (formsStorageType == null)
                throw new InvalidOperationException("Could not find type Umbraco.Forms.Core.Data.Storage.IFormStorage in assembly " + formsAssembly);


            //create a FormsStorage instance
            object formsStorageInstance;
            try
            {
                formsStorageInstance = _httpContextAccessor.HttpContext.RequestServices.GetService(formsStorageType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unable to get instance of Umbraco.Forms.Core.Data.Storage.IFormStorage from Container");

                //If we cannot create it then there's nothing we can do
                return;
            }

            // If the form already exists - skip out instead of trying to import a duplicate.
            try
            {
                var existingForm = CallMethod(formsStorageInstance, "GetForm", ContactFormId);
                if (existingForm != null)
                {
                    _logger.LogInformation("Skipped creating form - it already exists.");
                    return;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unable to call method GetForm on FormStorage");
                return;
            }

            //Insert the form, then dispose the FormsStorage
            try
            {
                CallMethod(formsStorageInstance, "InsertForm", form, string.Empty, false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unable to call method InsertForm on FormStorage");

                //If we cannot create it then there's nothing we can do
                return;
            }

            _logger.LogInformation("Created Form for Starter Kit");
        }

        #region Reflection Helpers

        private static object CallMethod(object obj, string methodName, params object[] parameters)
        {
            if (obj == null)
                throw new ArgumentNullException(nameof(obj));
            var type = obj.GetType();
            var methodInfo = GetMethodInfo(type, methodName, parameters);
            if (methodInfo == null)
                throw new ArgumentOutOfRangeException(nameof(methodName), $"Couldn't find method {methodName} in type {type.FullName}");
            return methodInfo.Invoke(obj, parameters);
        }

        private static MethodInfo GetMethodInfo(Type type, string methodName, object[] parameters)
        {
            if (type == null)
                throw new ArgumentNullException(nameof(type));
            if (string.IsNullOrWhiteSpace(methodName))
                throw new ArgumentException("Value cannot be null or whitespace.", nameof(methodName));

            var method = type.GetMethod(methodName, 
                BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic,
                null, 
                parameters.Select(x => x.GetType()).ToArray(), 
                null);            
            return method;
        }
        
        #endregion
    }
}