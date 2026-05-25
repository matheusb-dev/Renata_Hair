using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RenataHair.Domain.Entities;

[Table("agendamentos")]
public class Agendamento
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("cliente_id")]
    public int ClienteId { get; set; }

    [Column("funcionario_id")]
    public int FuncionarioId { get; set; }

    [Column("data")]
    public DateOnly Data { get; set; }

    [Column("hora_inicio")]
    public TimeOnly HoraInicio { get; set; }

    [Column("hora_fim")]
    public TimeOnly HoraFim { get; set; }

    [Column("total")]
    public decimal Total { get; set; }

    [Column("criado_em")]
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public Cliente? Cliente { get; set; }

    public Funcionario? Funcionario { get; set; }

    public List<AgendamentoServico> Servicos { get; set; } = new();
}