using Microsoft.AspNetCore.Routing;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Extensions;
using Umbraco.SampleSite.Controllers;

namespace Umbraco.SampleSite;

public class StarterKitNotificationHandler : INotificationHandler<ServerVariablesParsingNotification>
{
    private readonly LinkGenerator _linkGenerator;

    public StarterKitNotificationHandler(LinkGenerator linkGenerator) => _linkGenerator = linkGenerator;

    /// <summary>
    /// Handles the <see cref="ServerVariablesParsing"/> notification to add custom urls
    /// </summary>
    public void Handle(ServerVariablesParsingNotification notification)
    {
        IDictionary<string, object> serverVars = notification.ServerVariables;

        if (!serverVars.ContainsKey("umbracoUrls"))
        {
            throw new ArgumentException("Missing umbracoUrls.");
        }
        
        object umbracoUrlsObject = serverVars["umbracoUrls"] ?? throw new ArgumentException("Null umbracoUrls");

        if (umbracoUrlsObject is not Dictionary<string, object> umbracoUrls)
        {
            throw new ArgumentException("Invalid umbracoUrls");
        }

        //Add to 'Umbraco.Sys.ServerVariables.umbracoUrls.lessonsApiBaseUrl' global JS object
        //The URL/route for this API endpoint to be consumed by the Lessons AngularJS Service
        umbracoUrls["lessonsApiBaseUrl"] = _linkGenerator.GetUmbracoApiServiceBaseUrl<LessonsController>(controller => controller.GetLessons(""))!;
    }
}
