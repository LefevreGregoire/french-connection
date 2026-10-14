using FluentAssertions;
using Nexus.Domain.Models;

namespace Nexus.UnitTests.Domain;

public class ContainerNodeTests
{
    [Theory]
    [InlineData("running", VisualAlertLevel.Healthy)]
    [InlineData("RUNNING", VisualAlertLevel.Healthy)]
    [InlineData("restarting", VisualAlertLevel.Warning)]
    [InlineData("paused", VisualAlertLevel.Warning)]
    [InlineData("exited", VisualAlertLevel.Critical)]
    [InlineData("dead", VisualAlertLevel.Critical)]
    [InlineData("created", VisualAlertLevel.Neutral)]
    public void ComputeAlertLevel_ShouldMapDockerStateToCorrectVisualColor(
        string rawState, VisualAlertLevel expectedLevel)
    {
        var result = ContainerNode.ComputeAlertLevel(rawState);
        result.Should().Be(expectedLevel);
    }
}