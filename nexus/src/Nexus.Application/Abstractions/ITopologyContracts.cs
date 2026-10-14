using Nexus.Domain.Models;

namespace Nexus.Application.Abstractions;

public sealed record DockerLifecycleEvent(string ContainerId, string Action);

public interface IContainerRuntime
{
    Task<IReadOnlyList<ContainerNode>> GetContainersSnapshotAsync(CancellationToken ct = default);
    Task ListenToEventsAsync(Func<DockerLifecycleEvent, Task> onEvent, CancellationToken ct = default);
}

public interface ITopologyBroadcaster
{
    Task BroadcastTopologyAsync(IReadOnlyList<ContainerNode> nodes, CancellationToken ct = default);
}