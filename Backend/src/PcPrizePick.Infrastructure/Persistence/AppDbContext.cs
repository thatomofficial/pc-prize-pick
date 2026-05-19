using Microsoft.EntityFrameworkCore;
using PcPrizePick.Domain.Competitions;

namespace PcPrizePick.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Competition> Competitions => Set<Competition>();

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
    }
}
