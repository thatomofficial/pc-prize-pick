using Microsoft.EntityFrameworkCore;
using PcPrizePick.Domain.Competitions;
using PcPrizePick.Infrastructure.Persistence;

namespace PcPrizePick.Infrastructure.Competitions;

public class CompetitionsRepository : ICompetitionsRepository
{
    private readonly AppDbContext _db;

    public CompetitionsRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Competition>> GetFeaturedAsync(CancellationToken ct) =>
        await _db.Competitions
            .Where(c => c.Status == CompetitionStatus.Live || c.Status == CompetitionStatus.ClosingSoon)
            .OrderByDescending(c => c.PrizeValueCents)
            .Take(4)
            .ToListAsync(ct);

    public Task<Competition?> GetBySlugAsync(string slug, CancellationToken ct) =>
        _db.Competitions.FirstOrDefaultAsync(c => c.Slug == slug, ct);

    public async Task<DateTimeOffset> GetCurrentWaveCloseAtAsync(CancellationToken ct)
    {
        var closeAt = await _db.Competitions
            .Where(c => c.Status == CompetitionStatus.Live || c.Status == CompetitionStatus.ClosingSoon)
            .Select(c => (DateTimeOffset?)c.ClosesAt)
            .OrderBy(d => d)
            .FirstOrDefaultAsync(ct);

        if (closeAt is not null) return closeAt.Value;

        // No live wave — return the next anchor: upcoming Sunday 23:59:59.999 SAST.
        return NextWaveCloseAt(DateTimeOffset.UtcNow);
    }

    internal static DateTimeOffset NextWaveCloseAt(DateTimeOffset from)
    {
        // SAST is UTC+02:00 year-round. We pick the SAST Sunday that's at
        // least 7 days out, then pin to 23:59:59.999 SAST.
        var sast = TimeSpan.FromHours(2);
        var candidate = from.ToOffset(sast).AddDays(7);
        while (candidate.DayOfWeek != DayOfWeek.Sunday)
        {
            candidate = candidate.AddDays(1);
        }
        return new DateTimeOffset(
            candidate.Year, candidate.Month, candidate.Day,
            23, 59, 59, 999, sast);
    }
}
