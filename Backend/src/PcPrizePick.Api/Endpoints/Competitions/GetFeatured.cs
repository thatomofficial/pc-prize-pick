using PcPrizePick.Api.Extensions;
using PcPrizePick.Api.Infrastructure;
using PcPrizePick.Application.Abstractions.Messaging;
using PcPrizePick.Application.Competitions;
using PcPrizePick.Application.Competitions.GetFeatured;
using PcPrizePick.SharedKernel;

namespace PcPrizePick.Api.Endpoints.Competitions;

internal sealed class GetFeatured : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("api/competitions", async (
            IQueryHandler<GetFeaturedCompetitionsQuery, IReadOnlyList<CompetitionSummary>> handler,
            CancellationToken cancellationToken) =>
        {
            Result<IReadOnlyList<CompetitionSummary>> result =
                await handler.HandleAsync(new GetFeaturedCompetitionsQuery(), cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithName("GetFeaturedCompetitions")
        .WithTags(Tags.Competitions);
    }
}
