using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PcPrizePick.Domain.Competitions;
using PcPrizePick.Domain.Inventory;
using PcPrizePick.Domain.Users;
using PcPrizePick.Infrastructure.Competitions;
using PcPrizePick.Infrastructure.Inventory;
using PcPrizePick.Infrastructure.Persistence;
using PcPrizePick.Infrastructure.Time;
using PcPrizePick.Infrastructure.Users;
using PcPrizePick.SharedKernel;

namespace PcPrizePick.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration) =>
        services
            .AddServices()
            .AddDatabase(configuration)
            .AddRepositories()
            .AddHealthChecksInternal(configuration);

    private static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();

        return services;
    }

    private static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        string connectionString = configuration.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException("ConnectionStrings:Postgres is not configured.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        return services;
    }

    private static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        services.AddScoped<ICompetitionsRepository, CompetitionsRepository>();
        services.AddScoped<IPcBuildsRepository, PcBuildsRepository>();
        services.AddScoped<IUsersRepository, UsersRepository>();

        return services;
    }

    private static IServiceCollection AddHealthChecksInternal(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddHealthChecks()
            .AddNpgSql(configuration.GetConnectionString("Postgres")!);

        return services;
    }
}
