using Umbraco.Core;
using Umbraco.Core.Components;

namespace Umbraco.SampleSite
{
    [RuntimeLevel(MinLevel = RuntimeLevel.Run)]
    public class StarterKitComposer : IUserComposer
    {
        public void Compose(Composition composition)
        {
            //TODO: Implement this (needs a newer V8 Nuget build)
            //composition.TourFilters();

            //    //disable some of the default core tours since they don't make sense to have when the starter kit is installed
            //    //TourFilterResolver.Current.AddFilter(BackOfficeTourFilter.FilterAlias(new Regex("umbIntroCreateDocType|umbIntroCreateContent|umbIntroRenderInTemplate|umbIntroViewHomePage|umbIntroMediaSection")));

            composition.Components().Append<StarterKitComponent>();
        }
    }
}
