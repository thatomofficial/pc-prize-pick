namespace PcPrizePick.Domain.Competitions;

public enum CompetitionStatus
{
    Live,
    ClosingSoon,
    SoldOut,
    Upcoming,
    Drawn
}

public class Competition
{
    public Guid Id { get; private set; }
    public required string Slug { get; init; }
    public required string Name { get; set; }
    public required string BuildTagline { get; set; }
    public CompetitionStatus Status { get; set; } = CompetitionStatus.Live;
    public long PrizeValueCents { get; set; }
    public long EntryPriceCents { get; set; }
    public long CashAlternativeCents { get; set; }
    public int TotalEntries { get; set; }
    public int EntriesSold { get; set; }
    public required DateTimeOffset ClosesAt { get; set; }
    public required Specs Specs { get; set; }
    public int AccentHue { get; set; }

    public Competition()
    {
        Id = Guid.CreateVersion7();
    }
}

public record Specs(string Cpu, string Gpu, string Ram, string Storage);
