using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PcPrizePick.Domain.Competitions;
using PcPrizePick.Infrastructure.Competitions;
using PcPrizePick.Infrastructure.Persistence;

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

        return services;
    }
}
