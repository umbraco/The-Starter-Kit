using System.ComponentModel.DataAnnotations;

namespace Umbraco.SampleSite.Models;

public class ContactFormViewModel
{
    [Required]
    [MaxLength(64)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(10000)]
    public string Message { get; set; } = string.Empty;
}
