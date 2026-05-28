using Microsoft.EntityFrameworkCore;
using RenataHair.Domain.Entities;

namespace RenataHair.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios { get; set; }

    public DbSet<TokenInvalidado> TokensInvalidados { get; set; }

    public DbSet<Cliente> Clientes { get; set; }

    public DbSet<Servico> Servicos { get; set; }

    public DbSet<Funcionario> Funcionarios { get; set; }

    public DbSet<Agendamento> Agendamentos { get; set; }

    public DbSet<AgendamentoServico> AgendamentoServicos { get; set; }



    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>()
            .ToTable("usuarios");

        modelBuilder.Entity<TokenInvalidado>()
            .ToTable("tokens_invalidados");

        modelBuilder.Entity<Cliente>()
            .ToTable("clientes");

        modelBuilder.Entity<Servico>()
            .ToTable("servicos");

        modelBuilder.Entity<Funcionario>()
            .ToTable("funcionarios");

        modelBuilder.Entity<Agendamento>()
            .ToTable("agendamentos");

        modelBuilder.Entity<AgendamentoServico>()
            .ToTable("agendamento_servicos");

        modelBuilder.Entity<Funcionario>()
            .HasMany(f => f.Servicos)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>(
                "funcionario_servicos",

                j => j
                    .HasOne<Servico>()
                    .WithMany()
                    .HasForeignKey("servico_id"),

                j => j
                    .HasOne<Funcionario>()
                    .WithMany()
                    .HasForeignKey("funcionario_id"),

                j =>
                {
                    j.HasKey("funcionario_id", "servico_id");

                    j.ToTable("funcionario_servicos");
                });

        modelBuilder.Entity<AgendamentoServico>()
            .HasOne(x => x.Agendamento)
            .WithMany(x => x.Servicos)
            .HasForeignKey(x => x.AgendamentoId);

        modelBuilder.Entity<AgendamentoServico>()
            .HasOne(x => x.Servico)
            .WithMany()
            .HasForeignKey(x => x.ServicoId);
    }
}