using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Cache;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Logging;
using Umbraco.Cms.Core.Mail;
using Umbraco.Cms.Core.Models.Email;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Infrastructure.Persistence;
using Umbraco.Cms.Web.Website.Controllers;

namespace Umbraco.SampleSite
{
    public class ContactFormController : SurfaceController
    {
        private readonly IEmailSender _emailSender;
        private readonly IOptions<GlobalSettings> _globalSettings;

        public ContactFormController(
            IUmbracoContextAccessor umbracoContextAccessor, 
            IUmbracoDatabaseFactory databaseFactory, 
            ServiceContext services,
            AppCaches appCaches, 
            IProfilingLogger profilingLogger,
            IPublishedUrlProvider publishedUrlProvider,
            IEmailSender emailSender,
            IOptions<GlobalSettings> globalSettings) 
            : base(umbracoContextAccessor, databaseFactory, services, appCaches, profilingLogger, publishedUrlProvider)
        {
            _emailSender = emailSender;
            _globalSettings = globalSettings;
        }

        public async Task<IActionResult> Submit(ContactFormViewModel model)
        {
            if (!ModelState.IsValid)
                return CurrentUmbracoPage();
            
            TempData["Message"] = await HandleSuccessfulSubmitAsync(model);
            
            return RedirectToCurrentUmbracoPage();
        }

        protected virtual async Task<string> HandleSuccessfulSubmitAsync(ContactFormViewModel model)
        {
            var mailMessage = new EmailMessage(_globalSettings.Value?.Smtp?.From ?? "noreply@umbraco.com", model.Email, $"Website Contact form: {model.Name}", model.Message, true);
            await _emailSender.SendAsync(mailMessage, "StarterKitContactEmail", true);
            
            return "Message submitted";
        }
    }
}