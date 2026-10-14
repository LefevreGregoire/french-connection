namespace Nexus.Domain.Models;

public enum VisualAlertLevel
{
    Healthy,    // Cyan / Vert (Running)
    Warning,    // Orange (Restarting / Paused)
    Critical,   // Rouge néon (Exited / Dead)
    Neutral     // Gris (Created)
}

public sealed record ContainerNode(
    string Id,
    string Name,
    string Image,
    string RawState,
    VisualAlertLevel AlertLevel,
    IReadOnlyList<string> Networks
)
{
    public static VisualAlertLevel ComputeAlertLevel(string rawDockerState) =>
        rawDockerState.ToLowerInvariant() switch
        {
            "running" => VisualAlertLevel.Healthy,
            "restarting" or "paused" => VisualAlertLevel.Warning,
            "exited" or "dead" or "removing" => VisualAlertLevel.Critical,
            _ => VisualAlertLevel.Neutral
        };
}