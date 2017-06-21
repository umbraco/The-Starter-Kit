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
    public class UmbracoEvents : ApplicationEventHandler
    {
        protected override void ApplicationStarted(UmbracoApplicationBase umbracoApplication, ApplicationContext applicationContext)
        {
            InstalledPackage.AfterSave += InstalledPackage_AfterSave;
        }

        /// <summary>
        /// This will update the Contact template 
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void InstalledPackage_AfterSave(InstalledPackage sender, EventArgs e)
        {
            if (sender.Data.Name == "Umbraco Forms" && sender.Data.Files.Count > 20)
            {
                var fileService = ApplicationContext.Current.Services.FileService;

                // update contact template
                var contactView = fileService.GetTemplate("contact");
                if (contactView != null)
                {
                    var templateContent = contactView.Content;
                    templateContent = templateContent.Replace(Installer.InstallPackageAction.PostInstallContactFormHtml, Installer.InstallPackageAction.PreInstallContactFormHtml);
                    contactView.Content = templateContent;
                    fileService.SaveTemplate(contactView);
                }
            }
        }
    }
}
