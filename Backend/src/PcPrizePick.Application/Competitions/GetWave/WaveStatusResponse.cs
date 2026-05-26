namespace PcPrizePick.Application.Competitions.GetWave;

/// <summary>
/// The single shared wave countdown. One clock per page, not per build —
/// <paramref name="CloseAt"/> is the upcoming Sunday 23:59:59.999 SAST.
/// </summary>
public sealed record WaveStatusResponse(DateTimeOffset CloseAt, string WaveCode);
