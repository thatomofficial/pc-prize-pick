using PcPrizePick.Application.Competitions;

namespace PcPrizePick.Api.Endpoints;

public static class CompetitionsEndpoints
{
    public static IEndpointRouteBuilder MapCompetitionsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/competitions").WithTags("Competitions");

        group.MapGet("/", async (CompetitionsService service, CancellationToken ct) =>
            await service.GetFeaturedAsync(ct))
            .WithName("GetFeaturedCompetitions");

        group.MapGet("/wave", async (CompetitionsService service, CancellationToken ct) =>
            await service.GetWaveStatusAsync(ct))
            .WithName("GetWaveStatus");

        group.MapGet("/{slug}", async (string slug, CompetitionsService service, CancellationToken ct) =>
        {
            var competition = await service.GetBySlugAsync(slug, ct);
            return competition is null
                ? Results.NotFound()
                : Results.Ok(competition);
        })
            .WithName("GetCompetitionBySlug");

        return app;
    }
}
