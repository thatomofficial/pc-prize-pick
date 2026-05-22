namespace PcPrizePick.Domain.Inventory;

public class Psu
{
    public Guid Id { get; private set; }
    public required string Brand { get; set; }
    public required string Model { get; set; }
    public int? Wattage { get; set; }
    public string? EfficiencyRating { get; set; }
    public string? Modularity { get; set; }

    public Psu()
    {
        Id = Guid.CreateVersion7();
    }
}
