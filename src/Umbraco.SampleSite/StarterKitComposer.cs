using System.Text.RegularExpressions;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Infrastructure.Migrations.Notifications;
using Umbraco.SampleSite.Migrations;

namespace Umbraco.SampleSite;

public partial class StarterKitComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.AddNotificationHandler<MigrationPlansExecutedNotification, PostMigrationNotificationHandler>();
    }

    [GeneratedRegex("umbIntroCreateDocType|umbIntroCreateContent|umbIntroRenderInTemplate|umbIntroViewHomePage|umbIntroMediaSection")]
    private static partial Regex ToursToRemoveRegex();
}
