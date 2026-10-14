using Microsoft.AspNetCore.SignalR;
using Nexus.Application.Abstractions;
using Nexus.Application.Services;
using Nexus.Domain.Models;

namespace Nexus.Api.Realtime;

public sealed class TopologyHub(TopologyOrchestrator orchestrator) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var snapshot = orchestrator.CurrentSnapshot.Count > 0
            ? orchestrator.CurrentSnapshot
            : await orchestrator.RefreshAndBroadcastAsync();

        await Clients.Caller.SendAsync("TopologyUpdated", snapshot);
        await base.OnConnectedAsync();
    }
}

public sealed class SignalRTopologyBroadcaster(IHubContext<TopologyHub> hubContext) : ITopologyBroadcaster
{
    public Task BroadcastTopologyAsync(IReadOnlyList<ContainerNode> nodes, CancellationToken ct = default) =>
        hubContext.Clients.All.SendAsync("TopologyUpdated", nodes, ct);
}

public sealed class DockerMonitorWorker(
    IContainerRuntime runtime,
    TopologyOrchestrator orchestrator,
    ILogger<DockerMonitorWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            logger.LogInformation("Nexus démarré : lecture du snapshot Docker initial...");
            await orchestrator.RefreshAndBroadcastAsync(stoppingToken);

            logger.LogInformation("Écoute temps réel du démon Docker activée.");
            await runtime.ListenToEventsAsync(async evt =>
            {
                logger.LogInformation("Événement Docker : {Action} sur {Id}", evt.Action, evt.ContainerId[..12]);
                await orchestrator.HandleLifecycleEventAsync(evt, stoppingToken);
            }, stoppingToken);
        }
        catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
        {
            logger.LogError(ex, "Impossible de joindre le démon Docker. Vérifie que Docker Desktop est lancé.");
        }
    }
}