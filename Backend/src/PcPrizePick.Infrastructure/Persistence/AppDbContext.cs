using Microsoft.EntityFrameworkCore;
using PcPrizePick.Domain.Competitions;
using PcPrizePick.Domain.Inventory;

namespace PcPrizePick.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Competition> Competitions => Set<Competition>();
    public DbSet<PcBuild> PcBuilds => Set<PcBuild>();
    public DbSet<Cpu> Cpus => Set<Cpu>();
    public DbSet<Gpu> Gpus => Set<Gpu>();
    public DbSet<Motherboard> Motherboards => Set<Motherboard>();
    public DbSet<Psu> Psus => Set<Psu>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Competition>(entity =>
        {
            entity.ToTable("competitions");
            entity.HasKey(c => c.Id);
            entity.HasIndex(c => c.Slug).IsUnique();
            entity.Property(c => c.Slug).HasMaxLength(120).IsRequired();
            entity.Property(c => c.Name).HasMaxLength(200).IsRequired();
            entity.Property(c => c.BuildTagline).HasMaxLength(500).IsRequired();
            entity.Property(c => c.Status).HasConversion<string>().HasMaxLength(30);
            entity.OwnsOne(c => c.Specs, specs =>
            {
                specs.Property(s => s.Cpu).HasColumnName("spec_cpu").HasMaxLength(120).IsRequired();
                specs.Property(s => s.Gpu).HasColumnName("spec_gpu").HasMaxLength(120).IsRequired();
                specs.Property(s => s.Ram).HasColumnName("spec_ram").HasMaxLength(120).IsRequired();
                specs.Property(s => s.Storage).HasColumnName("spec_storage").HasMaxLength(120).IsRequired();
            });
        });

        modelBuilder.Entity<Cpu>(entity =>
        {
            entity.ToTable("cpus");
            entity.HasKey(c => c.Id);
            entity.HasIndex(c => new { c.Brand, c.Model }).IsUnique();
            entity.Property(c => c.Brand).HasMaxLength(60).IsRequired();
            entity.Property(c => c.Model).HasMaxLength(120).IsRequired();
            entity.Property(c => c.Socket).HasMaxLength(40);
            entity.Property(c => c.BaseClockGhz).HasPrecision(4, 2);
            entity.Property(c => c.BoostClockGhz).HasPrecision(4, 2);
        });

        modelBuilder.Entity<Gpu>(entity =>
        {
            entity.ToTable("gpus");
            entity.HasKey(g => g.Id);
            entity.HasIndex(g => new { g.Brand, g.Model }).IsUnique();
            entity.Property(g => g.Brand).HasMaxLength(60).IsRequired();
            entity.Property(g => g.Model).HasMaxLength(120).IsRequired();
            entity.Property(g => g.MemoryType).HasMaxLength(40);
        });

        modelBuilder.Entity<Motherboard>(entity =>
        {
            entity.ToTable("motherboards");
            entity.HasKey(m => m.Id);
            entity.HasIndex(m => new { m.Brand, m.Model }).IsUnique();
            entity.Property(m => m.Brand).HasMaxLength(60).IsRequired();
            entity.Property(m => m.Model).HasMaxLength(120).IsRequired();
            entity.Property(m => m.Chipset).HasMaxLength(40);
            entity.Property(m => m.Socket).HasMaxLength(40);
            entity.Property(m => m.FormFactor).HasMaxLength(40);
            entity.Property(m => m.RamType).HasMaxLength(40);
        });

        modelBuilder.Entity<Psu>(entity =>
        {
            entity.ToTable("psus");
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => new { p.Brand, p.Model }).IsUnique();
            entity.Property(p => p.Brand).HasMaxLength(60).IsRequired();
            entity.Property(p => p.Model).HasMaxLength(120).IsRequired();
            entity.Property(p => p.EfficiencyRating).HasMaxLength(40);
            entity.Property(p => p.Modularity).HasMaxLength(40);
        });

        modelBuilder.Entity<PcBuild>(entity =>
        {
            entity.ToTable("pc_builds");
            entity.HasKey(b => b.Id);
            entity.HasIndex(b => b.Slug).IsUnique();
            entity.Property(b => b.Name).HasMaxLength(200).IsRequired();
            entity.Property(b => b.Slug).HasMaxLength(200).IsRequired();
            entity.Property(b => b.ShortDescription).HasMaxLength(500);
            entity.Property(b => b.SourceProductUrl).HasMaxLength(500);
            entity.Property(b => b.SourceRetailer).HasMaxLength(120);
            entity.Property(b => b.SourceImageUrl).HasMaxLength(500);
            entity.Property(b => b.EstimatedValue).HasPrecision(12, 2);
            entity.Property(b => b.CashAlternativeValue).HasPrecision(12, 2);
            entity.Property(b => b.BuildStatus).HasConversion<string>().HasMaxLength(30);
            entity.Property(b => b.ScrapeConfidence).HasConversion<string>().HasMaxLength(20);
            entity.Property(b => b.ScrapeWarnings).HasColumnType("jsonb");
            entity.Property(b => b.RawSpecs).HasColumnType("jsonb");

            entity.HasOne(b => b.Cpu)
                .WithMany()
                .HasForeignKey(b => b.CpuId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(b => b.Gpu)
                .WithMany()
                .HasForeignKey(b => b.GpuId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(b => b.Motherboard)
                .WithMany()
                .HasForeignKey(b => b.MotherboardId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(b => b.Psu)
                .WithMany()
                .HasForeignKey(b => b.PsuId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
