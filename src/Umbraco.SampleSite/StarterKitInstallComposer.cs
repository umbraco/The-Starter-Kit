using System.Reflection;
using Umbraco.Core;
using Umbraco.Core.Composing;
using Umbraco.Web;

namespace Umbraco.SampleSite
{
    // This is a work around for later versions of v8 in order to force bind the required events during install
    [RuntimeLevel(MinLevel = RuntimeLevel.Install, MaxLevel = RuntimeLevel.Install)]
    public class StarterKitInstallComposer : IUserComposer
    {
        public void Compose(Composition composition)
        {
            var propertyEditorComposerType = typeof(UmbracoHelper).Assembly.GetType("Umbraco.Web.PropertyEditors.PropertyEditorsComposer", false);
            if (propertyEditorComposerType == null) return;

            var runtimeLevel = propertyEditorComposerType.GetCustomAttribute<RuntimeLevelAttribute>();
            if (runtimeLevel == null) return;
            // This is the default in <= 8.6 which means we don't get event binding
            // which is why we have this work around, if this is changed in future versions we'll assume we don't have to do the work around below
            if (runtimeLevel.MinLevel != Core.RuntimeLevel.Run) return;

            var propertyEditorComponentType = typeof(UmbracoHelper).Assembly.GetType("Umbraco.Web.PropertyEditors.PropertyEditorsComponent", false);
            if (propertyEditorComponentType == null) return;

            composition.Components().Append<StarterKitInstallComponent>();
            // manually add this because the normal umbraco composer won't because it's run level is too low
            composition.Components().Append(propertyEditorComponentType);
        }
    }
}
