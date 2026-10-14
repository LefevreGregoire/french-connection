using Docker.DotNet;
using Docker.DotNet.Models;
using Nexus.Application.Abstractions;
using Nexus.Domain.Models;
using DomainNode = Nexus.Domain.Models.ContainerNode;

namespace Nexus.Infrastructure.Docker;

public sealed class LocalDockerRuntime : IContainerRuntime, IDisposable
{
    private readonly IDockerClient _client;

    public LocalDockerRuntime(string? socketUri = null)
    {
        // Détection automatique Windows (Named Pipe) vs Linux (Unix Socket)
        var defaultUri = OperatingSystem.IsWindows()
            ? "npipe://./pipe/docker_engine"
            : "unix:///var/run/docker.sock";

        _client = new DockerClientConfiguration(new Uri(socketUri ?? defaultUri)).CreateClient();
    }

    public async Task<IReadOnlyList<DomainNode>> GetContainersSnapshotAsync(CancellationToken ct = default)
    {
        var containers = await _client.Containers.ListContainersAsync(
            new ContainersListParameters { All = true }, ct);

        return containers.Select(MapToDomain).ToList();
    }

    public async Task ListenToEventsAsync(
        Func<DockerLifecycleEvent, Task> onEvent,
        CancellationToken ct = default)
    {
        var parameters = new ContainerEventsParameters
        {
            Filters = new Dictionary<string, IDictionary<string, bool>>
            {
                ["type"] = new Dictionary<string, bool> { ["container"] = true },
                ["event"] = new Dictionary<string, bool>
                {
                    ["start"] = true,
                    ["stop"] = true,
                    ["die"] = true,
                    ["destroy"] = true,
                    ["create"] = true
                }
            }
        };

        var progress = new Progress<Message>(async message =>
        {
            if (!string.IsNullOrEmpty(message.Actor?.ID) && !string.IsNullOrEmpty(message.Action))
            {
                await onEvent(new DockerLifecycleEvent(message.Actor.ID, message.Action));
            }
        });

        await _client.System.MonitorEventsAsync(parameters, progress, ct);
    }

    private static DomainNode MapToDomain(ContainerListResponse c)
    {
        var cleanName = c.Names.FirstOrDefault()?.TrimStart('/') ?? c.ID[..12];
        var networks = c.NetworkSettings?.Networks?.Keys.ToList() ?? [];

        return new DomainNode(
            Id: c.ID[..12],
            Name: cleanName,
            Image: c.Image,
            RawState: c.State,
            AlertLevel: DomainNode.ComputeAlertLevel(c.State),
            Networks: networks
        );
    }

    public void Dispose() => _client.Dispose();
}