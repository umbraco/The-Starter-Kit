using Umbraco.Core;
using Umbraco.Core.Services;

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
