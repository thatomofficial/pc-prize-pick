using Serilog.Context;

namespace PcPrizePick.Api.Middleware;

/// <summary>
/// Pushes the request's correlation id into the Serilog <see cref="LogContext"/>
/// so every log line emitted while handling the request carries it. Reads the
/// id that <see cref="CorrelationIdMiddleware"/> already resolved (and stamped
/// on the response), falling back to the framework trace identifier. Must run
/// AFTER <c>UseCorrelationId()</c> so the item is populated.
/// </summary>
public sealed class RequestContextLoggingMiddleware(RequestDelegate next)
{
    public Task Invoke(HttpContext context)
    {
        string correlationId = GetCorrelationId(context);

        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            return next.Invoke(context);
        }
    }

    private static string GetCorrelationId(HttpContext context)
    {
        if (context.Items.TryGetValue(CorrelationIdMiddleware.ContextItemKey, out object? value) &&
            value is string id &&
            !string.IsNullOrWhiteSpace(id))
        {
            return id;
        }

        return context.TraceIdentifier;
    }
}
