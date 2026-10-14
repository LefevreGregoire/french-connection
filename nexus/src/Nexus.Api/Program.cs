using Nexus.Api.Realtime;
using Nexus.Application.Abstractions;
using Nexus.Application.Services;
using Nexus.Infrastructure.Docker;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AtlasDev", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

builder.Services.AddSignalR();

// Bascule automatique : Simulateur par défaut sur ce poste, ou vrai Docker si UseMockDocker = false
var useMock = builder.Configuration.GetValue("UseMockDocker", defaultValue: true);
if (useMock)
{
    var simulator = new SimulatedDockerRuntime();
    builder.Services.AddSingleton(simulator);
    builder.Services.AddSingleton<IContainerRuntime>(simulator);
}
else
{
    builder.Services.AddSingleton<IContainerRuntime>(_ => new LocalDockerRuntime());
}

builder.Services.AddSingleton<ITopologyBroadcaster, SignalRTopologyBroadcaster>();
builder.Services.AddSingleton<TopologyOrchestrator>();
builder.Services.AddHostedService<DockerMonitorWorker>();

var app = builder.Build();

app.UseCors("AtlasDev");

app.MapGet("/api/topology", (TopologyOrchestrator orchestrator) => orchestrator.CurrentSnapshot);

// Endpoint Chaos Engineering : permet de couper/relancer un conteneur en 1 clic ou via curl
app.MapPost("/api/sim/toggle/{id}", async (string id, IServiceProvider sp) =>
{
    var sim = sp.GetService<SimulatedDockerRuntime>();
    if (sim is null)
        return Results.BadRequest("Le mode simulation est désactivé.");

    var updated = await sim.ToggleContainerStateAsync(id);
    return updated is not null ? Results.Ok(updated) : Results.NotFound();
});

app.MapHub<TopologyHub>("/hubs/topology");

app.Run();