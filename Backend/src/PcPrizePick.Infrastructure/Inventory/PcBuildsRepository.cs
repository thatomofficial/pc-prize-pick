using Microsoft.EntityFrameworkCore;
using PcPrizePick.Domain.Inventory;
using PcPrizePick.Infrastructure.Persistence;

namespace PcPrizePick.Infrastructure.Inventory;

public class PcBuildsRepository : IPcBuildsRepository
{
    private readonly AppDbContext _db;

    public PcBuildsRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<PcBuild>> ListAsync(CancellationToken ct)
    {
        return await _db.PcBuilds
            .AsNoTracking()
            .Include(b => b.Cpu)
            .Include(b => b.Gpu)
            .Include(b => b.Motherboard)
            .Include(b => b.Psu)
            .OrderByDescending(b => b.IsFeatured)
            .ThenByDescending(b => b.EstimatedValue)
            .ToListAsync(ct);
    }

    public async Task<PcBuild?> GetBySlugAsync(string slug, CancellationToken ct)
    {
        return await _db.PcBuilds
            .AsNoTracking()
            .Include(b => b.Cpu)
            .Include(b => b.Gpu)
            .Include(b => b.Motherboard)
            .Include(b => b.Psu)
            .FirstOrDefaultAsync(b => b.Slug == slug, ct);
    }

    public async Task<IReadOnlyList<PcBuild>> ListFeaturedAsync(CancellationToken ct)
    {
        return await _db.PcBuilds
            .AsNoTracking()
            .Include(b => b.Cpu)
            .Include(b => b.Gpu)
            .Include(b => b.Motherboard)
            .Include(b => b.Psu)
            .Where(b => b.IsFeatured)
            .OrderByDescending(b => b.EstimatedValue)
            .ToListAsync(ct);
    }
}
