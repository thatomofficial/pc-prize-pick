namespace PcPrizePick.Application.Competitions;

/// <summary>
/// Read-side projection of a <see cref="Domain.Competitions.Competition"/>.
/// Shared by the featured-list and by-slug queries. Money stays in cents
/// (the Frontend divides by 100 at render time).
/// </summary>
public sealed record CompetitionSummary(
    Guid Id,
    string Slug,
    string Name,
    string BuildTagline,
    string Status,
    long PrizeValueCents,
    long EntryPriceCents,
    long CashAlternativeCents,
    int TotalEntries,
    int EntriesSold,
    DateTimeOffset ClosesAt,
    string SpecCpu,
    string SpecGpu,
    string SpecRam,
    string SpecStorage,
    int AccentHue);
