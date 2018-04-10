# 7.6-Starter-Kit

# This Github project is _solely_ used to manage the final build of the Starter Kit and is _not_ meant to be used as the Starter kit itself.

TODO: We need to merge this repo: https://github.com/umbraco/Starterkit-TheUmbracoCommunity into this one and remove the css/js one, they should exist in this one only.

You can find the Starter Kit as the default option in Umbraco 7.6.4+ as well as in the package repository on Our Umbraco.

Default Back Office user is:
Email: 	mail@me.com
Password: 1234567890

Don't use the website in this project, but instead ask to be a part of this Umbraco Cloud project:
https://umbraco-starter-kit.s1.umbraco.io

# Building the package

The build script is: /build/build.ps1 run it in the powershell cli: `.\build\build.ps1`

It will prompt you for the version number and pre-release. Example, enter `1.0.0` for the build number and 
if it's a pre-release enter `beta-01` (be sure to enter the hyphen prefix). 
If it's not a pre-release just press enter to skip that step.

The package output will be `/build/Releases/(VersionNumber)/Umbraco.SampleSite.zip`

# Maintaining the package

If changes are made to the package, the package manifest file will need to be updated:

* Save the package in the back office - this will update the /App_Data/packages/created/createdPackages.config
* Publish the package in the back office and press the download button to download the .zip file
* Open the zip file and find the package.xml file, copy it's contents to the /build/packageManifest.xml file. Alternatively you can manually edit the /build/packageManifest.xml file if you know what needs to be changed.

