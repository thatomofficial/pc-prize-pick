namespace PcPrizePick.Domain.Competitions;

public interface ICompetitionsRepository
{
    Task<IReadOnlyList<Competition>> GetFeaturedAsync(CancellationToken ct);
    Task<Competition?> GetBySlugAsync(string slug, CancellationToken ct);
    Task<DateTimeOffset> GetCurrentWaveCloseAtAsync(CancellationToken ct);
}
