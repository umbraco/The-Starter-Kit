using System.Text.RegularExpressions;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Tour;
using Umbraco.Cms.Infrastructure.WebAssets;
using Umbraco.Extensions;

namespace Umbraco.SampleSite
{
    public class StarterKitComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            //disable some of the default core tours since they don't make sense to have when the starter kit is installed
            builder.TourFilters().AddFilter(BackOfficeTourFilter.FilterAlias(new Regex("umbIntroCreateDocType|umbIntroCreateContent|umbIntroRenderInTemplate|umbIntroViewHomePage|umbIntroMediaSection")));
            
            builder.AddNotificationHandler<ServerVariablesParsingNotification, StarterKitNotificationHandler>();
        }
    }
}
