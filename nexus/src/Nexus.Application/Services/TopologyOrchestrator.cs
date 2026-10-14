using Nexus.Application.Abstractions;
using Nexus.Domain.Models;

namespace Nexus.Application.Services;

public sealed class TopologyOrchestrator(
    IContainerRuntime runtime,
    ITopologyBroadcaster broadcaster)
{
    private IReadOnlyList<ContainerNode> _currentSnapshot = [];

    public IReadOnlyList<ContainerNode> CurrentSnapshot => _currentSnapshot;

    public async Task<IReadOnlyList<ContainerNode>> RefreshAndBroadcastAsync(CancellationToken ct = default)
    {
        _currentSnapshot = await runtime.GetContainersSnapshotAsync(ct);
        await broadcaster.BroadcastTopologyAsync(_currentSnapshot, ct);
        return _currentSnapshot;
    }

    public async Task HandleLifecycleEventAsync(DockerLifecycleEvent evt, CancellationToken ct = default)
    {
        await RefreshAndBroadcastAsync(ct);
    }
}