using System;
using Umbraco.Cms.Core.Packaging;

namespace Umbraco.SampleSite.Migrations
{
    public class StarterKitPackageMigrationPlan : PackageMigrationPlan
    {
        public StarterKitPackageMigrationPlan()
            : base("The-Starter-Kit")
        {
        }

        protected override void DefinePlan()
        {
            To<FileImportPackageMigration>(new Guid("E4894FFD-A76F-4163-9C12-FC3F6917E3B0"));
            To<ImportPackageXmlMigration>(new Guid("811DA7DE-9131-4242-BBA2-D81BC33C2B43"));
        }
    }
}