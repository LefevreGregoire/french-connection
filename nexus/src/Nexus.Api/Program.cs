using Nexus.Api.Realtime;
using Nexus.Application.Abstractions;
using Nexus.Application.Services;
using Nexus.Infrastructure.Docker;

var builder = WebApplication.CreateBuilder(args);

// Autorise localhost ET les accès distants (IP Hetzner, VPN Tailscale/WireGuard, Reverse Proxy)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AtlasDev", policy =>
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

builder.Services.AddSignalR();

var useMock = builder.Configuration.GetValue("UseMockDocker", defaultValue: true);
if (useMock)
{
    builder.Services.AddSingleton<IContainerRuntime, SimulatedDockerRuntime>();
}
else
{
    var socketUri = builder.Configuration.GetValue<string>("DockerSocketUri");
    builder.Services.AddSingleton<IContainerRuntime>(_ => new LocalDockerRuntime(socketUri));
}

builder.Services.AddSingleton<ITopologyBroadcaster, SignalRTopologyBroadcaster>();
builder.Services.AddSingleton<TopologyOrchestrator>();
builder.Services.AddHostedService<DockerMonitorWorker>();

var app = builder.Build();

app.UseCors("AtlasDev");

app.MapGet("/api/topology", (TopologyOrchestrator orchestrator) => orchestrator.CurrentSnapshot);

// Fonctionne désormais sur le simulateur ET sur le vrai Docker Hetzner !
app.MapPost("/api/sim/toggle/{id}", async (string id, IContainerRuntime runtime, CancellationToken ct) =>
{
    var updated = await runtime.ToggleContainerStateAsync(id, ct);
    return updated is not null ? Results.Ok(updated) : Results.NotFound();
});

app.MapHub<TopologyHub>("/hubs/topology");

app.Run();