using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<TokenInvalidado> TokensInvalidados { get; set; }

    public DbSet<Cliente> Clientes { get; set; }

    public DbSet<Servico> Servicos { get; set; }

    public DbSet<Funcionario> Funcionarios { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>().ToTable("usuarios");
        modelBuilder.Entity<TokenInvalidado>().ToTable("tokens_invalidados");
        modelBuilder.Entity<Cliente>().ToTable("clientes");
        modelBuilder.Entity<Servico>().ToTable("servicos");
        modelBuilder.Entity<Funcionario>().ToTable("funcionarios");
    }
}