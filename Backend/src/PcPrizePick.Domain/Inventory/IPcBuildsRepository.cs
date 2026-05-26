namespace PcPrizePick.Domain.Inventory;

public interface IPcBuildsRepository
{
    Task<IReadOnlyList<PcBuild>> ListAsync(CancellationToken ct);
    Task<PcBuild?> GetBySlugAsync(string slug, CancellationToken ct);
    Task<IReadOnlyList<PcBuild>> ListFeaturedAsync(CancellationToken ct);
}
