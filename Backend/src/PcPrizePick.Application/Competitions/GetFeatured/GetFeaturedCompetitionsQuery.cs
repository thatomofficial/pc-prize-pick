using PcPrizePick.Application.Abstractions.Messaging;

namespace PcPrizePick.Application.Competitions.GetFeatured;

public sealed record GetFeaturedCompetitionsQuery : IQuery<IReadOnlyList<CompetitionSummary>>;
