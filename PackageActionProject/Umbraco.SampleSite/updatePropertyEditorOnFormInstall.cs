using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using umbraco.BusinessLogic;
using umbraco.cms.businesslogic.packager;
using Umbraco.Core;
using Umbraco.Core.Models;
using Umbraco.Core.Services;
using Umbraco.Web;

namespace Umbraco.SampleSite
{
    public class updatePropertyEditorOnFormInstall : ApplicationEventHandler
    {
        protected override void ApplicationStarted(UmbracoApplicationBase umbracoApplication, ApplicationContext applicationContext)
        {
            InstalledPackage.AfterSave += InstalledPackage_AfterSave;
        }


        private void InstalledPackage_AfterSave(InstalledPackage sender, EventArgs e)
        {
            if (sender.Data.Name == "Umbraco Forms" && sender.Data.Files.Count > 20)
            {
                // find the doctype and change the form chooser property type
                var doctypeService = ApplicationContext.Current.Services.ContentTypeService;
                var fileService = ApplicationContext.Current.Services.FileService;
/*                var contactFormType = doctypeService.GetContentType("contact");
                if (contactFormType != null)
                {

                    var formPicker = contactFormType.PropertyTypes.FirstOrDefault(x => x.Alias == "contactForm");
                    if (formPicker != null && formPicker.PropertyEditorAlias == "Label")
                    {
                        formPicker.PropertyEditorAlias = "UmbracoForms.FormPicker";
                        doctypeService.Save(contactFormType);
                    }
                }

    */
                // update contact template
                var contactView = fileService.GetTemplate("contact");
                if (contactView != null)
                {
                    var templateContent = contactView.Content;
                    templateContent = templateContent.Replace(Installer.InstallPackageAction.POST_INSTALL_CONTACT_FORM_HTML, Installer.InstallPackageAction.PRE_INSTALL_CONTACT_FORM_HTML);
                    contactView.Content = templateContent;
                    fileService.SaveTemplate(contactView);
                }
            }
        }
    }
}
