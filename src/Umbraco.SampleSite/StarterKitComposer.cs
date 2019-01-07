using System.Text.RegularExpressions;
using Umbraco.Core;
using Umbraco.Core.Components;
using Umbraco.Web.Tour;

namespace Umbraco.SampleSite
{
    [RuntimeLevel(MinLevel = RuntimeLevel.Run)]
    public class StarterKitComposer : IUserComposer
    {
        public void Compose(Composition composition)
        {
            //disable some of the default core tours since they don't make sense to have when the starter kit is installed
            composition.TourFilters().AddFilter(BackOfficeTourFilter.FilterAlias(new Regex("umbIntroCreateDocType|umbIntroCreateContent|umbIntroRenderInTemplate|umbIntroViewHomePage|umbIntroMediaSection")));
            
            composition.Components().Append<StarterKitComponent>();
        }
    }
}
