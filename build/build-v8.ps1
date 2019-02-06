param (
	[Parameter(Mandatory=$false)]
	[ValidatePattern("^\d+\.\d+\.(?:\d+\.\d+$|\d+$)|^\d+\.\d+\.\d+-(\w|-|\.)+$")]
	[string]
	$ReleaseVersionNumber,
	[Parameter(Mandatory=$false)]
	[string]
	[AllowEmptyString()]
	$PreReleaseName
)

# NOTE, the $ReleaseVersionNumber can be used for nightlies otherwise the xml is used
if(( -not [string]::IsNullOrEmpty($ReleaseVersionNumber)) -And [string]::IsNullOrEmpty($PreReleaseName) -And $ReleaseVersionNumber.Contains("-"))
{	
	$parts = $ReleaseVersionNumber.Split("-")
	$ReleaseVersionNumber = $parts[0]
	$PreReleaseName = $parts[1]
	Write-Host "Version parts split: ($ReleaseVersionNumber) and ($PreReleaseName)"
}

$PSScriptFilePath = Get-Item $MyInvocation.MyCommand.Path
$RepoRoot = $PSScriptFilePath.Directory.Parent.FullName
$BuildFolder = Join-Path -Path $RepoRoot -ChildPath "build";
$WebProjFolder = Join-Path -Path $RepoRoot -ChildPath "src\Umbraco.SampleSite.Web";
$ReleaseFolder = Join-Path -Path $BuildFolder -ChildPath "Releases-v8";
$TempFolder = Join-Path -Path $ReleaseFolder -ChildPath "Temp-v8";
$SolutionRoot = Join-Path -Path $RepoRoot "src";

if(( [string]::IsNullOrEmpty($ReleaseVersionNumber)))
{
	# Read XML
	$buildXmlFile = (Join-Path $BuildFolder "build.xml")
	[xml]$buildXml = Get-Content $buildXmlFile
	[System.Xml.XmlElement] $root = $buildXml.get_DocumentElement()
	$ReleaseVersionNumber = $root.version;
	if( $ReleaseVersionNumber.Contains("-"))
	{	
		$parts = $ReleaseVersionNumber.Split("-")
		$ReleaseVersionNumber = $parts[0]
		$PreReleaseName = $parts[1]
		Write-Host "Version parts split: ($ReleaseVersionNumber) and ($PreReleaseName)"
	}
}

$FullVersionName = $ReleaseVersionNumber
if(( -not [string]::IsNullOrEmpty($PreReleaseName)))
{	
	$FullVersionName = "$ReleaseVersionNumber-$PreReleaseName"
}

# Go get nuget.exe if we don't have it
$NuGet = "$BuildFolder\nuget.exe"
$FileExists = Test-Path $NuGet 
If ($FileExists -eq $False) {
	$SourceNugetExe = "https://dist.nuget.org/win-x86-commandline/latest/nuget.exe"
	Invoke-WebRequest $SourceNugetExe -OutFile $NuGet
}

# ensure we have vswhere
New-Item "$BuildFolder\vswhere" -type directory -force
$vswhere = "$BuildFolder\vswhere.exe"
if (-not (test-path $vswhere))
{
   Write-Host "Download VsWhere..."
   $path = "$BuildFolder\tmp"
   &$nuget install vswhere -OutputDirectory $path -Verbosity quiet
   $dir = ls "$path\vswhere.*" | sort -property Name -descending | select -first 1
   $file = ls -path "$dir" -name vswhere.exe -recurse
   mv "$dir\$file" $vswhere   
 }

$MSBuild = &$vswhere -latest -products * -requires Microsoft.Component.MSBuild -property installationPath
if ($MSBuild) {
  $MSBuild = join-path $MSBuild 'MSBuild\15.0\Bin\MSBuild.exe'
  if (-not (test-path $msbuild)) {
	throw "MSBuild not found!"
  }
}

if ((Get-Item $ReleaseFolder -ErrorAction SilentlyContinue) -ne $null)
{
	Write-Warning "$ReleaseFolder already exists on your local machine. It will now be deleted."
	Remove-Item $ReleaseFolder -Recurse
}


####### DO THE SLN BUILD PART #############

# Set the version number in SolutionInfo.cs
$SolutionInfoPath = Join-Path -Path $SolutionRoot -ChildPath "SolutionInfo.cs"
(gc -Path $SolutionInfoPath) `
	-replace "(?<=Version\(`")[.\d]*(?=`"\))", $ReleaseVersionNumber |
	sc -Path $SolutionInfoPath -Encoding UTF8
(gc -Path $SolutionInfoPath) `
	-replace "(?<=AssemblyInformationalVersion\(`")[.\w-]*(?=`"\))", $FullVersionName |
	sc -Path $SolutionInfoPath -Encoding UTF8
# Set the copyright
$Copyright = "Copyright � Umbraco " + (Get-Date).year;
(gc -Path $SolutionInfoPath) `
	-replace "(?<=AssemblyCopyright\(`").*(?=`"\))", $Copyright |
	sc -Path $SolutionInfoPath -Encoding UTF8;

# Build the solution in release mode
$SolutionPath = Join-Path -Path $SolutionRoot -ChildPath "Umbraco.SampleSite.sln";

#restore nuget packages
Write-Host "Restoring nuget packages..."
& $NuGet restore $SolutionPath

# clean sln for all deploys
& $MSBuild "$SolutionPath" /p:Configuration=Release /maxcpucount /t:Clean
if (-not $?)
{
	throw "The MSBuild process returned an error code."
}

#build
& $MSBuild "$SolutionPath" /p:Configuration=Release /maxcpucount
if (-not $?)
{
	throw "The MSBuild process returned an error code."
}

####### DO THE UMBRACO PACKAGE BUILD #############

# Set the version number in createdPackages.config
$CreatedPackagesConfig = Join-Path -Path $WebProjFolder -ChildPath "App_Data\packages\created\createdPackages.config"
$CreatedPackagesConfigXML = [xml](Get-Content $CreatedPackagesConfig)
$CreatedPackagesConfigXML.packages.package.version = $FullVersionName
$CreatedPackagesConfigXML.Save($CreatedPackagesConfig)

#copy the orig manifest to temp location to be updated to be used for the package
$PackageManifest = Join-Path -Path $BuildFolder -ChildPath "packageManifest.xml"
New-Item -ItemType Directory -Path $TempFolder
Copy-Item $PackageManifest "$TempFolder\package.xml"
$PackageManifest = (Join-Path -Path $TempFolder -ChildPath "package.xml")

# Set the data in packageManifest.config
$PackageManifestXML = [xml](Get-Content $PackageManifest)
$PackageManifestXML.umbPackage.info.package.version = $FullVersionName
$PackageManifestXML.umbPackage.info.package.name = $CreatedPackagesConfigXML.packages.package.name
$PackageManifestXML.umbPackage.info.package.license.set_InnerXML($CreatedPackagesConfigXML.packages.package.license.get_InnerXML())
$PackageManifestXML.umbPackage.info.package.license.url = $CreatedPackagesConfigXML.packages.package.license.url
$PackageManifestXML.umbPackage.info.package.url = $CreatedPackagesConfigXML.packages.package.url
$PackageManifestXML.umbPackage.info.author.name = $CreatedPackagesConfigXML.packages.package.author.get_InnerXML()
$PackageManifestXML.umbPackage.info.author.website = $CreatedPackagesConfigXML.packages.package.author.url

#clear the files from the manifest
$NewFilesXML = $PackageManifestXML.CreateElement("files")

#package the files ... This will lookup all files in the file system that need to be there and update
# the package manifest XML with the correct data along with copying these files to the  temp folder 
# so they can be zipped with the package

Function WritePackageFile ($f)
{
	Write-Host $f.FullName -foregroundcolor cyan
	$NewFileXML = $PackageManifestXML.CreateElement("file")
	$NewFileXML.set_InnerXML("<guid></guid><orgPath></orgPath><orgName></orgName>")
	$GuidName = ([guid]::NewGuid()).ToString() + "_" + $f.Name
	$NewFileXML.guid = $GuidName	
	$NewFileXML.orgPath = ReverseMapPath $f
	$NewFileXML.orgName = $f.Name
	$NewFilesXML.AppendChild($NewFileXML)
	Copy-Item $f.FullName "$TempFolder\$GuidName"
}
Function ReverseMapPath ($f)
{
	$resultPath = "~"+ $f.Directory.FullName.Replace($WebProjFolder, "").Replace("\","/")	
	Return $resultPath
}
Function MapPath ($f)
{
	$resultPath = Join-Path -Path $WebProjFolder -ChildPath ($f.Replace("~", "").Replace("/", "\"))
	Return $resultPath
}
foreach($FileXML in $CreatedPackagesConfigXML.packages.package.files.file)
{
	$File = Get-Item (MapPath $FileXML)
    if ($File -is [System.IO.DirectoryInfo]) 
    {
        Get-ChildItem -path $File -Recurse `
			| Where-Object { $_ -isnot [System.IO.DirectoryInfo]} `
			| ForEach-Object { WritePackageFile($_) } `
		    | Out-Null	
    }
	else {
		WritePackageFile($File)| Out-Null	
	}
}
$PackageManifestXML.umbPackage.ReplaceChild($NewFilesXML, $PackageManifestXML.SelectSingleNode("/umbPackage/files")) | Out-Null
$PackageManifestXML.Save($PackageManifest)

#finally zip the package
$DestZIP = "$ReleaseFolder\The-Starter_Kit_$FullVersionName.zip"
Add-Type -assembly "system.io.compression.filesystem"
[io.compression.zipfile]::CreateFromDirectory($TempFolder, $DestZIP) 