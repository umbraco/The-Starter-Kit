![CI](https://github.com/umbraco/The-Starter-Kit/workflows/CI/badge.svg?branch=dev-v8)

# 16.0-Starter-Kit

You can find the Starter Kit on NuGet by running the following command:

```bash
dotnet add package Umbraco.TheStarterKit --version 16.0.0-rc
```

## Content

Get in touch if you wish to have access to this Umbraco Cloud project, which contains the master content for the Starter Kit:
https://umbraco-starter-kit.s1.umbraco.io

## Development

If you are doing development for the Starter Kit, you can launch the [Umbraco.SampleSite.Web](examples/Umbraco.SampleSite.Web/) contained in this repo.

Run the project in Visual Studio or the terminal and the package migrations will run from the source project [Umbraco.SampleSite](src/Umbraco.SampleSite/) the first time.

### Changing view files

If you are going to change the views, you need to zip them back into the package.zip file located in `src/Umbraco.SampleSite/Migrations/package.zip`.
