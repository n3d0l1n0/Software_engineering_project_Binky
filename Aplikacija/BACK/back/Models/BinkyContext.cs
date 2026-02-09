using Microsoft.EntityFrameworkCore;

namespace MyBackend.Models;

public class BinkyContext : DbContext
{
    public DbSet<Lekar> Lekari { get; set; }
    public DbSet<Porodilja> Porodilje { get; set; }
    public DbSet<Leci> Lecenje { get; set; }
    public DbSet<Pregled> Pregledi { get; set; }
    public DbSet<TipPregleda> TipoviPregleda { get; set; }
    public DbSet<Rezultat> Rezultati { get; set; }
    public DbSet<Preporuka> Preporuke { get; set; }

    public BinkyContext(DbContextOptions<BinkyContext> options) : base(options)
    {


    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Pregled>()
            .Property(m => m.Termin)
            .HasConversion(t => t, t => DateTime.SpecifyKind(t, DateTimeKind.Utc));
    }
}
