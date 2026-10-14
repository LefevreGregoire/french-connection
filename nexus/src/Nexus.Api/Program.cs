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

builder.Services.AddSingleton<IContainerRuntime>(_ => new LocalDockerRuntime());
builder.Services.AddSingleton<ITopologyBroadcaster, SignalRTopologyBroadcaster>();
builder.Services.AddSingleton<TopologyOrchestrator>();
builder.Services.AddHostedService<DockerMonitorWorker>();

var app = builder.Build();

app.UseCors("AtlasDev");

app.MapGet("/api/topology", (TopologyOrchestrator orchestrator) => orchestrator.CurrentSnapshot);
app.MapHub<TopologyHub>("/hubs/topology");

app.Run();