using System;
using Umbraco.Cms.Core.Packaging;

namespace Umbraco.SampleSite.Migrations;

public class StarterKitPackageMigrationPlan : PackageMigrationPlan
{
    public StarterKitPackageMigrationPlan()
        : base("The-Starter-Kit")
    {
    }

    protected override void DefinePlan()
    {
        To<ImportPackageXmlMigration>(new Guid("A2A11BDF-1A21-4CE0-9E8E-D1D040FD503A"));
    }
}