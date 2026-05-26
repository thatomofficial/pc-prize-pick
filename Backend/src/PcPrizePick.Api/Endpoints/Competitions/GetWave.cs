using PcPrizePick.Api.Extensions;
using PcPrizePick.Api.Infrastructure;
using PcPrizePick.Application.Abstractions.Messaging;
using PcPrizePick.Application.Competitions.GetWave;
using PcPrizePick.SharedKernel;

namespace PcPrizePick.Api.Endpoints.Competitions;

internal sealed class GetWave : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("api/competitions/wave", async (
            IQueryHandler<GetWaveStatusQuery, WaveStatusResponse> handler,
            CancellationToken cancellationToken) =>
        {
            Result<WaveStatusResponse> result =
                await handler.HandleAsync(new GetWaveStatusQuery(), cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithName("GetWaveStatus")
        .WithTags(Tags.Competitions);
    }
}
