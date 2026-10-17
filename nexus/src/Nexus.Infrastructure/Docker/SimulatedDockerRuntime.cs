using System.Collections.Concurrent;
using Nexus.Application.Abstractions;
using Nexus.Domain.Models;

namespace Nexus.Infrastructure.Docker;

public sealed class SimulatedDockerRuntime : IContainerRuntime
{
    private readonly ConcurrentDictionary<string, ContainerNode> _containers = new();
    private Func<DockerLifecycleEvent, Task>? _onEventCallback;
    private readonly Random _rng = new();

    public SimulatedDockerRuntime()
    {
        SeedLabTopology();
    }

    private void SeedLabTopology()
    {
        var initialNodes = new[]
        {
            CreateNode("a1b2c3d4e5f1", "nginx-proxy-mgr", "jc21/nginx-proxy-manager:latest", "running", ["dmz", "lan-backend"], 14, 128, [
                "[GET] 200 /api/v1/health - 2.1ms (TLSv1.3)",
                "[PROXY] Upstream -> http://core-api-dotnet:5000",
                "[WAF] Handshake validated with crowdsec-bouncer"
            ]),
            CreateNode("a1b2c3d4e5f2", "waf-crowdsec", "crowdsecurity/crowdsec:latest", "running", ["dmz"], 22, 210, [
                "[INFO] CrowdSec LAPI listening on :8080",
                "[SCENARIO] http-probing: 0 ban active",
                "[HEARTBEAT] CAPI metrics synced successfully"
            ]),
            CreateNode("a1b2c3d4e5f3", "core-api-dotnet", "nexus/core-api:8.0", "running", ["lan-backend", "lan-data"], 38, 340, [
                "[INF] Now listening on: http://[::]:5000",
                "[INF] SignalR Hub /hubs/topology active",
                "[DB] EF Core connection pool healthy (postgres-primary)"
            ]),
            CreateNode("a1b2c3d4e5f4", "postgres-primary", "postgres:16-alpine", "running", ["lan-data"], 19, 512, [
                "LOG: database system is ready to accept connections",
                "LOG: checkpoint starting: time",
                "LOG: checkpoint complete: wrote 14 buffers (0.1%)"
            ]),
            CreateNode("a1b2c3d4e5f5", "redis-session", "redis:7-alpine", "running", ["lan-data"], 6, 64, [
                "* Ready to accept connections tcp",
                "* DB saved on disk (RDB snapshot)",
                "* 142 active session keys in memory"
            ]),
            CreateNode("a1b2c3d4e5f6", "legacy-worker", "debian:bookworm-slim", "exited", ["lan-backend"], 0, 0, [
                "[WARN] Memory allocation spike detected (98%)",
                "[ERR] Unhandled SIGTERM in batch processor",
                "[FATAL] Container exited with code 137 (OOMKilled)"
            ])
        };

        foreach (var node in initialNodes)
        {
            _containers[node.Id] = node;
        }
    }

    private static ContainerNode CreateNode(
        string id, string name, string image, string state, string[] networks, double cpu, int ram, string[] logs) =>
        new(id, name, image, state, ContainerNode.ComputeAlertLevel(state, cpu), networks, cpu, ram, logs);

    public Task<IReadOnlyList<ContainerNode>> GetContainersSnapshotAsync(CancellationToken ct = default)
    {
        IReadOnlyList<ContainerNode> snapshot = _containers.Values.OrderBy(c => c.Name).ToList();
        return Task.FromResult(snapshot);
    }

    public async Task ListenToEventsAsync(Func<DockerLifecycleEvent, Task> onEvent, CancellationToken ct = default)
    {
        _onEventCallback = onEvent;

        // Boucle de télémétrie temps réel : fait vivre le CPU et la RAM toutes les 2.5s
        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(2500, ct);

            foreach (var key in _containers.Keys)
            {
                if (_containers.TryGetValue(key, out var node) && node.RawState == "running")
                {
                    var deltaCpu = _rng.Next(-4, 5);
                    var newCpu = Math.Clamp(node.CpuUsage + deltaCpu, 3, 95);
                    var deltaRam = _rng.Next(-6, 7);
                    var newRam = Math.Clamp(node.RamMb + deltaRam, 32, 1024);

                    _containers[key] = node with
                    {
                        CpuUsage = newCpu,
                        RamMb = newRam,
                        AlertLevel = ContainerNode.ComputeAlertLevel(node.RawState, newCpu)
                    };
                }
            }

            if (_onEventCallback is not null)
            {
                await _onEventCallback(new DockerLifecycleEvent("telemetrytick0", "telemetry"));
            }
        }
    }

    public async Task<ContainerNode?> ToggleContainerStateAsync(string id, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        if (!_containers.TryGetValue(id, out var existing))
            return null;

        var willRun = existing.RawState != "running";
        var newState = willRun ? "running" : "exited";
        var action = willRun ? "start" : "die";
        var newCpu = willRun ? 22.0 : 0.0;
        var newRam = willRun ? 160 : 0;

        var timestamp = DateTime.Now.ToString("HH:mm:ss");
        var updatedLogs = (existing.Logs ?? []).TakeLast(4).Append(
            willRun
                ? $"[{timestamp}] Container started (healthcheck: PASS)"
                : $"[{timestamp}] SIGTERM received -> Container stopped"
        ).ToList();

        var updated = existing with
        {
            RawState = newState,
            AlertLevel = ContainerNode.ComputeAlertLevel(newState, newCpu),
            CpuUsage = newCpu,
            RamMb = newRam,
            Logs = updatedLogs
        };

        _containers[id] = updated;

        if (_onEventCallback is not null)
        {
            await _onEventCallback(new DockerLifecycleEvent(id, action));
        }

        return updated;
    }
}