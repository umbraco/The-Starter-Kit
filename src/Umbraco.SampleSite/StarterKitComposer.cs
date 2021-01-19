using System.Text.RegularExpressions;
using Umbraco.Core.Composing;
using Umbraco.Core.DependencyInjection;
using Umbraco.Web.Tour;

namespace Umbraco.SampleSite
{
    public class StarterKitComposer : IUserComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            //disable some of the default core tours since they don't make sense to have when the starter kit is installed
            builder.TourFilters().AddFilter(BackOfficeTourFilter.FilterAlias(new Regex("umbIntroCreateDocType|umbIntroCreateContent|umbIntroRenderInTemplate|umbIntroViewHomePage|umbIntroMediaSection")));
            
            builder.Components().Append<StarterKitComponent>();
            builder.Services.AddUnique<FormsInstallationHelper>();
        }
    }
}
