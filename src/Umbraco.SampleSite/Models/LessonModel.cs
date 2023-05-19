using System.Runtime.Serialization;

namespace Umbraco.SampleSite.Models;

/// <summary>
/// Simple POCO for binding JSON from our.umbraco WebAPI
/// </summary>
[DataContract(Name = "lesson")]
public class LessonModel
{
    [DataMember(Name = "name")]
    public string Name { get; set; } = string.Empty;

    [DataMember(Name = "path")]
    public string Path { get; set; } = string.Empty;

    [DataMember(Name = "level")]
    public string Level { get; set; } = string.Empty;

    [DataMember(Name = "url")]
    public string Url { get; set; } = string.Empty;

    [DataMember(Name = "directories")]
    public IEnumerable<LessonModel> Directories { get; set; } = Enumerable.Empty<LessonModel>();
}
