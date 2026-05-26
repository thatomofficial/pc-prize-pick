using PcPrizePick.Application.Abstractions.Messaging;
using PcPrizePick.Domain.Competitions;
using PcPrizePick.SharedKernel;

namespace PcPrizePick.Application.Competitions.GetBySlug;

internal sealed class GetCompetitionBySlugQueryHandler(ICompetitionsRepository repository)
    : IQueryHandler<GetCompetitionBySlugQuery, CompetitionSummary>
{
    public async Task<Result<CompetitionSummary>> HandleAsync(
        GetCompetitionBySlugQuery query,
        CancellationToken cancellationToken)
    {
        Competition? competition = await repository.GetBySlugAsync(query.Slug, cancellationToken);

        if (competition is null)
        {
            return Result.Failure<CompetitionSummary>(CompetitionErrors.NotFound(query.Slug));
        }

        return competition.ToSummary();
    }
}
