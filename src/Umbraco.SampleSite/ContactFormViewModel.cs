using System.ComponentModel.DataAnnotations;

namespace Umbraco.SampleSite
{
    public class ContactFormViewModel 
    {
        [Required]
        [MaxLength(64)]
        public string Name { get; set; }
        
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        
        [Required]
        [MaxLength(10000)]
        public string Message { get; set; }
    }
}