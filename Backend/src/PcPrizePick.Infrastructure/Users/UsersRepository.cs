using Microsoft.EntityFrameworkCore;
using PcPrizePick.Domain.Users;
using PcPrizePick.Infrastructure.Persistence;

namespace PcPrizePick.Infrastructure.Users;

public class UsersRepository : IUsersRepository
{
    private readonly AppDbContext _db;

    public UsersRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == normalized, ct);
    }

    public async Task AddAsync(User user, CancellationToken ct)
    {
        await _db.Users.AddAsync(user, ct);
        await _db.SaveChangesAsync(ct);
    }
}
