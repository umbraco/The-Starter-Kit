using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Migrations.Notifications;

namespace Umbraco.SampleSite.Migrations;

public class PostMigrationNotificationHandler : INotificationHandler<MigrationPlansExecutedNotification>
{
    private readonly IRuntimeState _runtimeState;
    private readonly IContentService _contentService;
    private readonly ILogger<PostMigrationNotificationHandler> _logger;

    public PostMigrationNotificationHandler(IRuntimeState runtimeState, IContentService contentService, ILogger<PostMigrationNotificationHandler> logger)
    {
        _runtimeState = runtimeState;
        _contentService = contentService;
        _logger = logger;
    }

    public void Handle(MigrationPlansExecutedNotification notification)
    {

        if (_runtimeState.Level is not RuntimeLevel.Run)
        {
            return;
        }

        // Check if we have run the right migration, otherwise skip
        if (HasMigrationRun(notification.ExecutedPlans) is false)
        {
            return;
        }

        IContent? contentHome = _contentService.GetRootContent().FirstOrDefault(x => x.ContentType.Alias == "home");
        if (contentHome is not null)
        {
            // publish everything (moved here due to Deploy dependency checking)
            _contentService.PublishBranch(contentHome, true, []);
        }
        else
        {
            _logger.LogWarning("The installed Home page was not found");
        }
    }

    private bool HasMigrationRun(IEnumerable<ExecutedMigrationPlan> executedMigrationPlans)
    {
        foreach (ExecutedMigrationPlan executedMigrationPlan in executedMigrationPlans)
        {
            foreach (MigrationPlan.Transition transition in executedMigrationPlan.CompletedTransitions)
            {
                if (transition.MigrationType == typeof(ImportPackageXmlMigration))
                {
                    return true;
                }
            }
        }

        return false;
    }
}
