using FluentAssertions;
using Nexus.Application.Abstractions;
using Nexus.Domain.Models;
using Nexus.Infrastructure.Docker; // <-- L'import corrigé est ici

namespace Nexus.UnitTests.Infrastructure;

public class SimulatedDockerRuntimeTests
{
    [Fact]
    public async Task ToggleContainerState_ShouldFlipRunningToExitedAndFireDieEvent()
    {
        // Arrange
        var sut = new SimulatedDockerRuntime();
        DockerLifecycleEvent? receivedEvent = null;

        using var cts = new CancellationTokenSource();
        _ = sut.ListenToEventsAsync(evt =>
        {
            receivedEvent = evt;
            return Task.CompletedTask;
        }, cts.Token);

        // Act : on coupe nginx-proxy-mgr (a1b2c3d4e5f1)
        var updated = await sut.ToggleContainerStateAsync("a1b2c3d4e5f1");

        // Assert
        updated.Should().NotBeNull();
        updated!.RawState.Should().Be("exited");
        updated.AlertLevel.Should().Be(VisualAlertLevel.Critical);
        receivedEvent.Should().NotBeNull();
        receivedEvent!.Action.Should().Be("die");

        cts.Cancel();
    }
}