using PcPrizePick.Domain.Competitions;

namespace PcPrizePick.Application.Competitions;

public record CompetitionSummary(
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

public record WaveStatus(DateTimeOffset CloseAt, string WaveCode);

public class CompetitionsService
{
    private readonly ICompetitionsRepository _repository;

    public CompetitionsService(ICompetitionsRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<CompetitionSummary>> GetFeaturedAsync(CancellationToken ct)
    {
        var competitions = await _repository.GetFeaturedAsync(ct);
        return competitions.Select(ToSummary).ToList();
    }

    public async Task<CompetitionSummary?> GetBySlugAsync(string slug, CancellationToken ct)
    {
        var c = await _repository.GetBySlugAsync(slug, ct);
        return c is null ? null : ToSummary(c);
    }

    public async Task<WaveStatus> GetWaveStatusAsync(CancellationToken ct)
    {
        var closeAt = await _repository.GetCurrentWaveCloseAtAsync(ct);
        var month = closeAt.ToString("MMM").ToUpperInvariant();
        var year = closeAt.ToString("yy");
        return new WaveStatus(closeAt, $"{month}/{year}");
    }

    private static CompetitionSummary ToSummary(Competition c) => new(
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
