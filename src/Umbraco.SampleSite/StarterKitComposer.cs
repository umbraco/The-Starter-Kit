using System.Text.RegularExpressions;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Tour;

namespace Umbraco.SampleSite;

public partial class StarterKitComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        //disable some of the default core tours since they don't make sense to have when the starter kit is installed
        builder.TourFilters().AddFilter(BackOfficeTourFilter.FilterAlias(ToursToRemoveRegex()));
        
        _ = builder.AddNotificationHandler<ServerVariablesParsingNotification, StarterKitNotificationHandler>();
    }

    [GeneratedRegex("umbIntroCreateDocType|umbIntroCreateContent|umbIntroRenderInTemplate|umbIntroViewHomePage|umbIntroMediaSection")]
    private static partial Regex ToursToRemoveRegex();
}
