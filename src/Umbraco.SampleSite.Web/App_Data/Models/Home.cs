using System.Linq;
using Umbraco.Core.PropertyEditors;

namespace Umbraco.Web.PublishedModels
{
    public partial class Home
    {
        public string FontString
        {
            get
            {
                var p = GetProperty("font");
                var o = p.PropertyType.DataType.Configuration;
                var configuration = ConfigurationEditor.ConfigurationAs<ValueListConfiguration>(o);
                return configuration.Items.First(x => x.Id == p.Value<int>()).Value;
            }
        }

        public string ColorThemeString
        {
            get
            {
                var p = GetProperty("colorTheme");
                var o = p.PropertyType.DataType.Configuration;
                var configuration = ConfigurationEditor.ConfigurationAs<ValueListConfiguration>(o);
                return configuration.Items.First(x => x.Id == p.Value<int>()).Value;
            }
        }
    }
}