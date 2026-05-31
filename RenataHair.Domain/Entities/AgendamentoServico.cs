using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RenataHair.Domain.Entities;

[Table("agendamento_servicos")]
public class AgendamentoServico
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("agendamento_id")]
    public int AgendamentoId { get; set; }

    [Column("servico_id")]
    public int ServicoId { get; set; }

    [Column("preco")]
    public decimal Preco { get; set; }

    [Column("tempo")]
    public int Tempo { get; set; }

    public Agendamento? Agendamento { get; set; }

    public Servico? Servico { get; set; }
}