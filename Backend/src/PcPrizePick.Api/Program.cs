using System.Reflection;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using PcPrizePick.Api;
using PcPrizePick.Api.Extensions;
using PcPrizePick.Api.Middleware;
using PcPrizePick.Application;
using PcPrizePick.Infrastructure;
using Serilog;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, loggerConfig) =>
    loggerConfig.ReadFrom.Configuration(context.Configuration));

builder.Services
    .AddApplication()
    .AddPresentation()
    .AddInfrastructure(builder.Configuration);

builder.Services.AddEndpoints(Assembly.GetExecutingAssembly());

const string FrontendCors = "Frontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCors, policy =>
    {
        string[] origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:4200"];
        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            // Browsers hide non-safelist response headers from JS by default.
            // Exposing x-request-id lets the Frontend pick up the id the
            // server stamped (or echoed) on every response.
            .WithExposedHeaders(CorrelationIdMiddleware.HeaderName);
    });
});

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwaggerWithUi();
}

// Correlation id flows BEFORE CORS so the preflight response carries it, and
// before request-context logging so the id is on every log line. Sits near
// the front so every downstream piece can read HttpContext.Items.
app.UseCorrelationId();
app.UseRequestContextLogging();

app.UseSerilogRequestLogging();

app.UseExceptionHandler();

app.UseCors(FrontendCors);

app.MapHealthChecks("health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

app.MapEndpoints();

await app.RunAsync();

// Exposed so the ArchitectureTests project can reference the Api assembly.
namespace PcPrizePick.Api
{
    public partial class Program;
}
