namespace Nexus.Domain.Models;

public enum VisualAlertLevel
{
    Healthy,    // Cyan / Vert (Running)
    Warning,    // Orange (Restarting / Paused / High CPU)
    Critical,   // Rouge néon (Exited / Dead)
    Neutral     // Gris (Created)
}

public sealed record ContainerNode(
    string Id,
    string Name,
    string Image,
    string RawState,
    VisualAlertLevel AlertLevel,
    IReadOnlyList<string> Networks,
    double CpuUsage = 0,
    int RamMb = 0,
    IReadOnlyList<string>? Logs = null
)
{
    public static VisualAlertLevel ComputeAlertLevel(string rawDockerState, double cpuUsage = 0) =>
        rawDockerState.ToLowerInvariant() switch
        {
            "running" when cpuUsage >= 85.0 => VisualAlertLevel.Warning,
            "running" => VisualAlertLevel.Healthy,
            "restarting" or "paused" => VisualAlertLevel.Warning,
            "exited" or "dead" or "removing" => VisualAlertLevel.Critical,
            _ => VisualAlertLevel.Neutral
        };
}