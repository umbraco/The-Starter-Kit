using System;
using System.IO;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Packaging;

namespace Umbraco.SampleSite.Migrations
{
    public class FileImportPackageMigration : MigrationBase
    {
        private readonly ILogger<FileImportPackageMigration> _logger;
        private readonly MediaFileManager _mediaFileManager;
        private readonly FileSystems _fileSystems;

        public FileImportPackageMigration(
            ILogger<FileImportPackageMigration> logger,
            IMigrationContext context,
            MediaFileManager mediaFileManager,
            FileSystems fileSystems)
            : base(context)
        {
            _logger = logger;
            _mediaFileManager = mediaFileManager;
            _fileSystems = fileSystems;
        }
    
        protected override void Migrate()
        {
            var type = GetType();
        
            var prefix = type.Namespace + ".Files";
            var assembly = GetType().Assembly; 
            var manifestResourceNames = assembly.GetManifestResourceNames();
            foreach (var manifestResourceName in manifestResourceNames)
            {
                try
                {
                    var path = GetPathFromEmbeddedResource(manifestResourceName, prefix);

                    var fileSystem = GetFileSystemFromPath(path);
                    if (fileSystem is not null)
                    {
                        using Stream input = assembly.GetManifestResourceStream(manifestResourceName);
                        //Remove first folder from the path
                        path = path.Substring(path.IndexOf(Path.DirectorySeparatorChar)+1);
                        
                        fileSystem.AddFile(path, input);
                    }
                    
                }
                catch (Exception e)
                {
                    _logger.LogError(e, "Import of package migration media failed, manifestResourceName: {manifestResourceName}", manifestResourceName);
                    throw;
                }

            }
        }

        private IFileSystem GetFileSystemFromPath(string path)
        {
            if (path.StartsWith("MacroPartials"))
            {
                return _fileSystems.MacroPartialsFileSystem;
            }
            if (path.StartsWith("Partials"))
            {
                return _fileSystems.PartialViewsFileSystem;
            }
            if (path.StartsWith("Media"))
            {
                return _mediaFileManager.FileSystem;
            }
            if (path.StartsWith("css"))
            {
                return _fileSystems.StylesheetsFileSystem;
            }
            if (path.StartsWith("scripts"))
            {
                return _fileSystems.ScriptsFileSystem;
            }
            return null;
        }

        private string GetPathFromEmbeddedResource(string manifestResourceName, string mediaPrefix)
        {
            var directorySeparatorChar = Path.DirectorySeparatorChar.ToString();
            var mediaPrefixLength = mediaPrefix.Length;

            //"._" is used if the folder start with a character that is not valid as first char in a namespace, e.g. a digit.
            var subPath = manifestResourceName.Substring(mediaPrefixLength).Replace("._", directorySeparatorChar);
            
            //Replaces all but the last dot
            return Regex.Replace(subPath, "\\.(?=.*?\\.)", directorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
        }
    }
}