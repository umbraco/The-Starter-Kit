using System.Runtime.Serialization;

namespace Umbraco.SampleSite.Models;

/// <summary>
/// Simple POCO for binding JSON from our.umbraco WebAPI.
/// </summary>
[DataContract(Name = "LesssonStep")]
public class LessonStepModel
{
    [DataMember(Name = "name")]
    public string Name { get; set; } = string.Empty;

    [DataMember(Name = "content")]
    public string Content { get; set; } = string.Empty;
}
