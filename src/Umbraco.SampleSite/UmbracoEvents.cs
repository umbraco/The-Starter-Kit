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
            PackagingService.ImportedPackage += PackagingService_ImportedPackage;            
        }

        /// <summary>
        ///  When the Umbraco Forms package is installed this will update the contact template and the forms picker property type
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void PackagingService_ImportedPackage(IPackagingService sender, Core.Events.ImportPackageEventArgs<Core.Packaging.Models.InstallationSummary> e)
        {
            if (e.PackageMetaData.Name == "Umbraco Forms")
            {
                var formsInstallHelper = new FormsInstallationHelper(ApplicationContext.Current.Services);
                formsInstallHelper.UpdateUmbracoDataForFormsInstallation();
            }
        }
    }
}
