namespace PcPrizePick.SharedKernel;

public interface IDateTimeProvider
{
    DateTimeOffset UtcNow { get; }
}
