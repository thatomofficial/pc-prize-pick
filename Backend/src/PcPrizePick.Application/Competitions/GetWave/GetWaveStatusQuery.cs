using PcPrizePick.Application.Abstractions.Messaging;

namespace PcPrizePick.Application.Competitions.GetWave;

public sealed record GetWaveStatusQuery : IQuery<WaveStatusResponse>;
