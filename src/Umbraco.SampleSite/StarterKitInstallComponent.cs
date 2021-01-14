using Umbraco.Core.Composing;
using Umbraco.Web.Website;

namespace Umbraco.SampleSite
{
    public class StarterKitInstallComponent : IComponent
    {
        public StarterKitInstallComponent()
        {
        }

        public void Initialize()
        {
            // If we've gotten here it's because our Composer has recognized that we need the work around and this component has been added

            var propertyEditorComponentType = typeof(UmbracoHelper).Assembly.GetType("Umbraco.Web.PropertyEditors.PropertyEditorsComponent", false);
            if (propertyEditorComponentType == null) return;

            // NOTE: We aren't injecting IFactory because that isn't supported in super old v8 versions :/ 
            //var propertyEditorComponent = (IComponent)Current.Factory.GetInstance(propertyEditorComponentType);
            // bind the events!
            //propertyEditorComponent.Initialize();
        }

        public void Terminate()
        {
        }
    }
}