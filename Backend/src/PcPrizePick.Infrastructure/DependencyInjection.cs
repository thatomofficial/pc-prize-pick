using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PcPrizePick.Domain.Competitions;
using PcPrizePick.Domain.Inventory;
using PcPrizePick.Domain.Users;
using PcPrizePick.Infrastructure.Competitions;
using PcPrizePick.Infrastructure.Inventory;
using PcPrizePick.Infrastructure.Persistence;
using PcPrizePick.Infrastructure.Users;

namespace PcPrizePick.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException("ConnectionStrings:Postgres is not configured.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
            {
                npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
            }));

        services.AddScoped<ICompetitionsRepository, CompetitionsRepository>();
        services.AddScoped<IPcBuildsRepository, PcBuildsRepository>();
        services.AddScoped<IUsersRepository, UsersRepository>();

        return services;
    }
}
