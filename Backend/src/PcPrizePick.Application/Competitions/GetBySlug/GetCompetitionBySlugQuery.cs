using PcPrizePick.Application.Abstractions.Messaging;

namespace PcPrizePick.Application.Competitions.GetBySlug;

public sealed record GetCompetitionBySlugQuery(string Slug) : IQuery<CompetitionSummary>;
