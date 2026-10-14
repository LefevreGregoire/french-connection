using System.Collections.Concurrent;
using Nexus.Application.Abstractions;
using Nexus.Domain.Models;

namespace Nexus.Infrastructure.Docker;

public sealed class SimulatedDockerRuntime : IContainerRuntime
{
    private readonly ConcurrentDictionary<string, ContainerNode> _containers = new();
    private Func<DockerLifecycleEvent, Task>? _onEventCallback;

    public SimulatedDockerRuntime()
    {
        SeedLabTopology();
    }

    private void SeedLabTopology()
    {
        var initialNodes = new[]
        {
            CreateNode("a1b2c3d4e5f1", "nginx-proxy-mgr", "jc21/nginx-proxy-manager:latest", "running", ["dmz", "lan-backend"]),
            CreateNode("a1b2c3d4e5f2", "waf-crowdsec", "crowdsecurity/crowdsec:latest", "running", ["dmz"]),
            CreateNode("a1b2c3d4e5f3", "core-api-dotnet", "nexus/core-api:8.0", "running", ["lan-backend", "lan-data"]),
            CreateNode("a1b2c3d4e5f4", "postgres-primary", "postgres:16-alpine", "running", ["lan-data"]),
            CreateNode("a1b2c3d4e5f5", "redis-session", "redis:7-alpine", "running", ["lan-data"]),
            CreateNode("a1b2c3d4e5f6", "legacy-worker", "debian:bookworm-slim", "exited", ["lan-backend"]) // Déjà en panne au démarrage !
        };

        foreach (var node in initialNodes)
        {
            _containers[node.Id] = node;
        }
    }

    private static ContainerNode CreateNode(string id, string name, string image, string state, string[] networks) =>
        new(id, name, image, state, ContainerNode.ComputeAlertLevel(state), networks);

    public Task<IReadOnlyList<ContainerNode>> GetContainersSnapshotAsync(CancellationToken ct = default)
    {
        IReadOnlyList<ContainerNode> snapshot = _containers.Values.OrderBy(c => c.Name).ToList();
        return Task.FromResult(snapshot);
    }

    public async Task ListenToEventsAsync(Func<DockerLifecycleEvent, Task> onEvent, CancellationToken ct = default)
    {
        _onEventCallback = onEvent;
        // Maintient l'écoute active jusqu'à l'arrêt de l'application
        await Task.Delay(Timeout.Infinite, ct);
    }

    // Méthode appelée par notre endpoint de Chaos Engineering pour allumer/éteindre un conteneur
    public async Task<ContainerNode?> ToggleContainerStateAsync(string id)
    {
        if (!_containers.TryGetValue(id, out var existing))
            return null;

        var newState = existing.RawState == "running" ? "exited" : "running";
        var action = newState == "running" ? "start" : "die";

        var updated = existing with
        {
            RawState = newState,
            AlertLevel = ContainerNode.ComputeAlertLevel(newState)
        };

        _containers[id] = updated;

        if (_onEventCallback is not null)
        {
            await _onEventCallback(new DockerLifecycleEvent(id, action));
        }

        return updated;
    }
}