namespace PcPrizePick.Api.Extensions;

internal static class ServiceCollectionExtensions
{
    internal static IServiceCollection AddSwaggerDocs(this IServiceCollection services)
    {
        // No auth scheme yet — the backend issues no JWTs (auth is mocked in
        // the Frontend). The reference adds a Bearer security definition here;
        // wire that in alongside the real auth story (F2.x).
        services.AddSwaggerGen(o =>
            o.CustomSchemaIds(id => id.FullName!.Replace('+', '-')));

        return services;
    }
}
