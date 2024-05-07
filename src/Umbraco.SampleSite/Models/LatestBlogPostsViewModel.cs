using Umbraco.Cms.Core.Models.PublishedContent;

namespace Umbraco.SampleSite.Models;

public class LatestBlogPostsViewModel
{
    public required IEnumerable<IPublishedContent> BlogPosts { get; set; }

    public required int Page { get; set; }

    public required int PageSize { get; set; }

    public required int PageCount { get; set; }

    public required int Total { get; set; }

    public required string Url { get; set; }
}
