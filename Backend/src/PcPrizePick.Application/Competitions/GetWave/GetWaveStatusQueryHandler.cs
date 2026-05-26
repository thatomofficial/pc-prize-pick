using PcPrizePick.Application.Abstractions.Messaging;
using PcPrizePick.Domain.Competitions;
using PcPrizePick.SharedKernel;

namespace PcPrizePick.Application.Competitions.GetWave;

internal sealed class GetWaveStatusQueryHandler(ICompetitionsRepository repository)
    : IQueryHandler<GetWaveStatusQuery, WaveStatusResponse>
{
    public async Task<Result<WaveStatusResponse>> HandleAsync(
        GetWaveStatusQuery query,
        CancellationToken cancellationToken)
    {
        DateTimeOffset closeAt = await repository.GetCurrentWaveCloseAtAsync(cancellationToken);

        string month = closeAt.ToString("MMM").ToUpperInvariant();
        string year = closeAt.ToString("yy");

        return new WaveStatusResponse(closeAt, $"{month}/{year}");
    }
}
