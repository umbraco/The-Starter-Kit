using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Web.Common.PublishedModels;
using Umbraco.Extensions;
using Umbraco.SampleSite.Models;

namespace Umbraco.SampleSite.Web.ViewComponents;

public class LatestBlogPostsViewComponent : ViewComponent
{
    private readonly IPublishedContentQuery _publishedContentQuery;

    public LatestBlogPostsViewComponent(IPublishedContentQuery publishedContentQuery) =>
        _publishedContentQuery = publishedContentQuery;

    public async Task<IViewComponentResult> InvokeAsync(decimal numberOfPosts, Guid startNodeKey)
    {
        IPublishedContent? rootNode = _publishedContentQuery.Content(startNodeKey);

        if (rootNode is null)
        {
            return View("NoContent");
        }

        var blogposts = rootNode.Children
            .OrderBy(x => x.CreateDate, Direction.Ascending)
            .ToList();

        if(blogposts.Count == 0)
        {
            return View("NoContent");
        }

        var pageCount = (int)Math.Ceiling(blogposts.Count / numberOfPosts);
        var page = 1;

        if (string.IsNullOrWhiteSpace(HttpContext.Request.Query["page"]) is false)
        {
            var succeeded = int.TryParse(HttpContext.Request.Query["page"], out page);

            if (succeeded is false || page <= 0 || page > pageCount)
            {
                page = 1;
            }
        }

        var blogPage = blogposts.Skip((page - 1) * (int)numberOfPosts).Take((int)numberOfPosts).ToList();

        return View(new LatestBlogPostsViewModel
        {
            BlogPosts = blogPage,
            Page = page,
            PageCount = pageCount,
            PageSize = (int)numberOfPosts,
            Total = blogposts.Count,
            Url = rootNode.Url()
        });
    }
}
