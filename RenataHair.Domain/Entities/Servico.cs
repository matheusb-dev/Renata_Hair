using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RenataHair.Domain.Entities;

[Table("servicos")]
public class Servico
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("nome")]
    [MaxLength(250)]
    public string Nome { get; set; } = string.Empty;

    [Column("tempo")]
    public int Tempo { get; set; }

    [Column("preco")]
    public decimal Preco { get; set; }

    [Column("criado_em")]
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}