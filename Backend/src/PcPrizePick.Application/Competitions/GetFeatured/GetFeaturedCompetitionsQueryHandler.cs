using PcPrizePick.Application.Abstractions.Messaging;
using PcPrizePick.Domain.Competitions;
using PcPrizePick.SharedKernel;

namespace PcPrizePick.Application.Competitions.GetFeatured;

internal sealed class GetFeaturedCompetitionsQueryHandler(ICompetitionsRepository repository)
    : IQueryHandler<GetFeaturedCompetitionsQuery, IReadOnlyList<CompetitionSummary>>
{
    public async Task<Result<IReadOnlyList<CompetitionSummary>>> HandleAsync(
        GetFeaturedCompetitionsQuery query,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<Competition> competitions = await repository.GetFeaturedAsync(cancellationToken);

        IReadOnlyList<CompetitionSummary> summaries = competitions
            .Select(c => c.ToSummary())
            .ToList();

        return Result.Success(summaries);
    }
}
