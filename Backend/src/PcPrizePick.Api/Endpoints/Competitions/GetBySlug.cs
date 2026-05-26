using PcPrizePick.Api.Extensions;
using PcPrizePick.Api.Infrastructure;
using PcPrizePick.Application.Abstractions.Messaging;
using PcPrizePick.Application.Competitions;
using PcPrizePick.Application.Competitions.GetBySlug;
using PcPrizePick.SharedKernel;

namespace PcPrizePick.Api.Endpoints.Competitions;

internal sealed class GetBySlug : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("api/competitions/{slug}", async (
            string slug,
            IQueryHandler<GetCompetitionBySlugQuery, CompetitionSummary> handler,
            CancellationToken cancellationToken) =>
        {
            Result<CompetitionSummary> result =
                await handler.HandleAsync(new GetCompetitionBySlugQuery(slug), cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithName("GetCompetitionBySlug")
        .WithTags(Tags.Competitions);
    }
}
