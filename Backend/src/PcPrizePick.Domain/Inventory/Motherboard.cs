namespace PcPrizePick.Domain.Inventory;

public class Motherboard
{
    public Guid Id { get; private set; }
    public required string Brand { get; set; }
    public required string Model { get; set; }
    public string? Chipset { get; set; }
    public string? Socket { get; set; }
    public string? FormFactor { get; set; }
    public string? RamType { get; set; }
    public int? MaxRamGb { get; set; }

    public Motherboard()
    {
        Id = Guid.CreateVersion7();
    }
}
