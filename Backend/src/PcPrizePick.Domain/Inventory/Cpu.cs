namespace PcPrizePick.Domain.Inventory;

public class Cpu
{
    public Guid Id { get; private set; }
    public required string Brand { get; set; }
    public required string Model { get; set; }
    public int? Cores { get; set; }
    public int? Threads { get; set; }
    public decimal? BaseClockGhz { get; set; }
    public decimal? BoostClockGhz { get; set; }
    public string? Socket { get; set; }
    public int? TdpWatts { get; set; }

    public Cpu()
    {
        Id = Guid.CreateVersion7();
    }
}
