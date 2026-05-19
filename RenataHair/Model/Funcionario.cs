using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("funcionarios")]
public class Funcionario
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

    [Column("endereco")]
    [MaxLength(250)]
    public string? Endereco { get; set; }

    [Column("turno")]
    [MaxLength(10)]
    public string Turno { get; set; } = string.Empty;

    [Column("horas_mensais")]
    public int? HorasMensais { get; set; }

    [Column("pj")]
    public bool Pj { get; set; } = false;

    [Column("criado_em")]
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}