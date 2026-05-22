namespace PcPrizePick.Domain.Inventory;

public enum BuildStatus
{
    Draft,
    Active,
    Archived
}

public enum ScrapeConfidence
{
    Unknown,
    Low,
    Medium,
    High
}

public class PcBuild
{
    public Guid Id { get; private set; }
    public required string Name { get; set; }
    public required string Slug { get; init; }
    public string? ShortDescription { get; set; }
    public string? FullDescription { get; set; }
    public decimal EstimatedValue { get; set; }
    public decimal CashAlternativeValue { get; set; }
    public BuildStatus BuildStatus { get; set; } = BuildStatus.Draft;
    public bool IsFeatured { get; set; }

    public Guid? CpuId { get; set; }
    public Cpu? Cpu { get; set; }

    public Guid? GpuId { get; set; }
    public Gpu? Gpu { get; set; }

    public Guid? MotherboardId { get; set; }
    public Motherboard? Motherboard { get; set; }

    public Guid? PsuId { get; set; }
    public Psu? Psu { get; set; }

    public string? SourceProductUrl { get; set; }
    public string? SourceRetailer { get; set; }
    public string? SourceImageUrl { get; set; }
    public ScrapeConfidence ScrapeConfidence { get; set; } = ScrapeConfidence.Unknown;
    public List<string> ScrapeWarnings { get; set; } = new();
    public Dictionary<string, string?> RawSpecs { get; set; } = new();

    public PcBuild()
    {
        Id = Guid.CreateVersion7();
    }
}
