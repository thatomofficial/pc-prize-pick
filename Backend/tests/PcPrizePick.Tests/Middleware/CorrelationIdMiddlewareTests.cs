using Microsoft.AspNetCore.Http;
using PcPrizePick.Api.Middleware;

namespace PcPrizePick.Tests.Middleware;

public class CorrelationIdMiddlewareTests
{
    private static async Task<DefaultHttpContext> RunPipeline(
        Action<HttpContext>? configureRequest = null)
    {
        var context = new DefaultHttpContext();
        configureRequest?.Invoke(context);
        // BodyWriter has to be set for OnStarting callbacks to fire when
        // we manually run middleware in isolation.
        context.Response.Body = new MemoryStream();

        var middleware = new CorrelationIdMiddleware(async innerContext =>
        {
            await innerContext.Response.WriteAsync("ok");
        });

        await middleware.InvokeAsync(context);
        return context;
    }

    [Fact]
    public async Task EchoesInboundIdOnResponse()
    {
        var context = await RunPipeline(c =>
            c.Request.Headers[CorrelationIdMiddleware.HeaderName] = "client-abc-123");

        Assert.Equal("client-abc-123", context.Response.Headers[CorrelationIdMiddleware.HeaderName]);
        Assert.Equal("client-abc-123", context.Items[CorrelationIdMiddleware.ContextItemKey]);
    }

    [Fact]
    public async Task GeneratesIdWhenHeaderMissing()
    {
        var context = await RunPipeline();

        var emitted = context.Response.Headers[CorrelationIdMiddleware.HeaderName].ToString();
        Assert.False(string.IsNullOrWhiteSpace(emitted));
        Assert.True(Guid.TryParse(emitted, out _));
        Assert.Equal(emitted, context.Items[CorrelationIdMiddleware.ContextItemKey]);
    }

    [Fact]
    public async Task GeneratesIdWhenHeaderIsEmpty()
    {
        var context = await RunPipeline(c =>
            c.Request.Headers[CorrelationIdMiddleware.HeaderName] = "   ");

        var emitted = context.Response.Headers[CorrelationIdMiddleware.HeaderName].ToString();
        Assert.True(Guid.TryParse(emitted, out _));
    }

    [Fact]
    public async Task RejectsControlCharactersAndMintsFresh()
    {
        var context = await RunPipeline(c =>
            c.Request.Headers[CorrelationIdMiddleware.HeaderName] = "abc\r\ninjected: header");

        var emitted = context.Response.Headers[CorrelationIdMiddleware.HeaderName].ToString();
        Assert.True(Guid.TryParse(emitted, out _));
        Assert.DoesNotContain("\r", emitted);
        Assert.DoesNotContain("\n", emitted);
    }

    [Fact]
    public async Task TrimsWhitespaceAroundInboundId()
    {
        var context = await RunPipeline(c =>
            c.Request.Headers[CorrelationIdMiddleware.HeaderName] = "   client-abc-123   ");

        Assert.Equal("client-abc-123", context.Response.Headers[CorrelationIdMiddleware.HeaderName]);
        Assert.Equal("client-abc-123", context.Items[CorrelationIdMiddleware.ContextItemKey]);
    }

    [Fact]
    public async Task RejectsOverlyLongIdAndMintsFresh()
    {
        var context = await RunPipeline(c =>
            c.Request.Headers[CorrelationIdMiddleware.HeaderName] = new string('x', 500));

        var emitted = context.Response.Headers[CorrelationIdMiddleware.HeaderName].ToString();
        Assert.True(Guid.TryParse(emitted, out _));
    }
}
