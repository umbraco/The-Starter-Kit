using System.Xml.Linq;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Packaging;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Packaging;

namespace Umbraco.SampleSite.Migrations
{
    public class ImportPackageXmlMigration : PackageMigrationBase
    {
        public ImportPackageXmlMigration(
            IPackagingService packagingService,
            IMediaService mediaService,
            MediaFileManager mediaFileManager, 
            MediaUrlGeneratorCollection mediaUrlGenerators,
            IShortStringHelper shortStringHelper, 
            IContentTypeBaseServiceProvider contentTypeBaseServiceProvider, 
            IMigrationContext context) 
            : base(packagingService, 
                mediaService,
                mediaFileManager, 
                mediaUrlGenerators, 
                shortStringHelper, 
                contentTypeBaseServiceProvider, 
                context)
        {
        }

        protected override void Migrate()
        {
            ImportPackage.FromEmbeddedResource(GetType()).Do();
            Context.AddPostMigration<PublishRootBranchPostMigration>();
        }
    }
}