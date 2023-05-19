using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;

namespace Umbraco.SampleSite.Migrations;

public class PublishRootBranchPostMigration : MigrationBase
{
    private readonly ILogger<PublishRootBranchPostMigration> _logger;
    private readonly IContentService _contentService;

    public PublishRootBranchPostMigration(
        ILogger<PublishRootBranchPostMigration> logger,
        IContentService contentService,
        IMigrationContext context) : base(context)
    {
        _logger = logger;
        _contentService = contentService;
    }

    protected override void Migrate()
    {
        IContent? contentHome = _contentService.GetRootContent().FirstOrDefault(x => x.ContentType.Alias == "home");
        if (contentHome is not null)
        {
            // publish everything (moved here due to Deploy dependency checking)
            _contentService.SaveAndPublishBranch(contentHome, true);
        }
        else
        {
            _logger.LogWarning("The installed Home page was not found");
        }
    }
}