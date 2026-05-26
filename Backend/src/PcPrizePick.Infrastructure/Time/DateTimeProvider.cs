using PcPrizePick.SharedKernel;

namespace PcPrizePick.Infrastructure.Time;

internal sealed class DateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
