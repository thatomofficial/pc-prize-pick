namespace PcPrizePick.Domain.Inventory;

public class Gpu
{
    public Guid Id { get; private set; }
    public required string Brand { get; set; }
    public required string Model { get; set; }
    public int? VramGb { get; set; }
    public string? MemoryType { get; set; }
    public int? PowerDrawWatts { get; set; }

    public Gpu()
    {
        Id = Guid.CreateVersion7();
    }
}
