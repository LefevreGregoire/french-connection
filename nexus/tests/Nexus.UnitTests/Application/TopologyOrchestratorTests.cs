using FluentAssertions;
using Nexus.Application.Abstractions;
using Nexus.Application.Services;
using Nexus.Domain.Models;
using NSubstitute;

namespace Nexus.UnitTests.Application;

public class TopologyOrchestratorTests
{
    [Fact]
    public async Task HandleLifecycleEvent_WhenContainerStops_ShouldRefreshSnapshotAndBroadcast()
    {
        var runtime = Substitute.For<IContainerRuntime>();
        var broadcaster = Substitute.For<ITopologyBroadcaster>();

        var updatedSnapshot = new List<ContainerNode>
        {
            new("abc123456789", "nginx-proxy", "nginx:latest", "exited", VisualAlertLevel.Critical, ["dmz"])
        };

        runtime.GetContainersSnapshotAsync(Arg.Any<CancellationToken>())
               .Returns(updatedSnapshot);

        var sut = new TopologyOrchestrator(runtime, broadcaster);

        await sut.HandleLifecycleEventAsync(new DockerLifecycleEvent("abc123456789", "die"));

        await broadcaster.Received(1).BroadcastTopologyAsync(
            Arg.Is<IReadOnlyList<ContainerNode>>(list =>
                list.Count == 1 &&
                list[0].Name == "nginx-proxy" &&
                list[0].AlertLevel == VisualAlertLevel.Critical),
            Arg.Any<CancellationToken>());
    }
}