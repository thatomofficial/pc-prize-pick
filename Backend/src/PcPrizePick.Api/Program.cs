using PcPrizePick.Api.Endpoints;
using PcPrizePick.Api.Middleware;
using PcPrizePick.Application.Competitions;
using PcPrizePick.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<CompetitionsService>();

const string FrontendCors = "Frontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCors, policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:4200"];
        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            // Browsers hide non-safelist response headers from JS by
            // default. Exposing x-request-id lets the Frontend pick up
            // the id the server stamped (or echoed) on every response.
            .WithExposedHeaders(CorrelationIdMiddleware.HeaderName);
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Correlation id flows BEFORE CORS so the preflight response carries it
// too. Sits at the very front of the pipeline so every downstream piece
// (logging, endpoints, error handlers) can pull the id out of
// HttpContext.Items.
app.UseCorrelationId();

app.UseCors(FrontendCors);

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithName("Health");

app.MapCompetitionsEndpoints();

app.Run();
