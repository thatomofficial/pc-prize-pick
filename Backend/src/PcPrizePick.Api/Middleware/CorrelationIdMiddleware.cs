namespace PcPrizePick.Api.Middleware;

/// <summary>
/// Reads the inbound <c>x-request-id</c> header (the Frontend stamps one
/// per call via <c>ApiClientService</c>) and echoes it back on the
/// response. When the client didn't supply one — or it's empty or
/// unreasonably long — we mint a fresh GUID so every request still has
/// a usable id in logs.
///
/// The id is exposed via <c>HttpContext.Items["CorrelationId"]</c> so
/// endpoint code and logging scopes can pick it up without re-parsing
/// headers.
/// </summary>
public sealed class CorrelationIdMiddleware
{
    public const string HeaderName = "x-request-id";
    public const string ContextItemKey = "CorrelationId";

    // Cap the inbound length to keep log volume sane and reject anything
    // that obviously isn't an id (line breaks, control chars).
    private const int MaxInboundLength = 128;

    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var id = ResolveOrGenerate(context.Request.Headers[HeaderName]);
        context.Items[ContextItemKey] = id;
        // Set immediately so the value is on the response by the time any
        // downstream piece (endpoint, exception handler, terminal middleware)
        // writes its body. Setting once up-front means we don't need an
        // OnStarting callback — simpler, and works in tests where the
        // header-send hook never fires on a MemoryStream-backed response.
        context.Response.Headers[HeaderName] = id;

        await _next(context);
    }

    private static string ResolveOrGenerate(IEnumerable<string?> incoming)
    {
        foreach (var candidate in incoming)
        {
            if (string.IsNullOrWhiteSpace(candidate)) continue;
            if (candidate.Length > MaxInboundLength) continue;
            if (candidate.Any(char.IsControl)) continue;
            return candidate;
        }
        return Guid.NewGuid().ToString("D");
    }
}

public static class CorrelationIdMiddlewareExtensions
{
    public static IApplicationBuilder UseCorrelationId(this IApplicationBuilder app) =>
        app.UseMiddleware<CorrelationIdMiddleware>();
}
