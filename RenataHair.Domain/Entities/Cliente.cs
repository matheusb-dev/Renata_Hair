using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RenataHair.Domain.Entities;

[Table("clientes")]
public class Cliente
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("nome")]
    [MaxLength(250)]
    public string Nome { get; set; } = string.Empty;

    [Column("cpf")]
    [MaxLength(11)]
    public string Cpf { get; set; } = string.Empty;

    [Column("telefone")]
    [MaxLength(11)]
    public string Telefone { get; set; } = string.Empty;

    [Column("email")]
    [MaxLength(250)]
    public string? Email { get; set; }

    [Column("plano")]
    [MaxLength(20)]
    public string Plano { get; set; } = "Nenhum";

    [Column("tipo_mensalidade")]
    [MaxLength(20)]
    public string? TipoMensalidade { get; set; }

    [Column("endereco")]
    [MaxLength(250)]
    public string? Endereco { get; set; }

    [Column("status")]
    [MaxLength(10)]
    public string Status { get; set; } = "Ativo";

    [Column("criado_em")]
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}