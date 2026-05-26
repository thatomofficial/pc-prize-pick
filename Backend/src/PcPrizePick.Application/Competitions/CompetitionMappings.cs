using PcPrizePick.Domain.Competitions;

namespace PcPrizePick.Application.Competitions;

internal static class CompetitionMappings
{
    public static CompetitionSummary ToSummary(this Competition c) => new(
        c.Id,
        c.Slug,
        c.Name,
        c.BuildTagline,
        c.Status.ToString(),
        c.PrizeValueCents,
        c.EntryPriceCents,
        c.CashAlternativeCents,
        c.TotalEntries,
        c.EntriesSold,
        c.ClosesAt,
        c.Specs.Cpu,
        c.Specs.Gpu,
        c.Specs.Ram,
        c.Specs.Storage,
        c.AccentHue);
}
