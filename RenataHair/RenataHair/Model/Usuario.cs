using System.ComponentModel.DataAnnotations.Schema;

[Table("usuarios")]
public class Usuario
{
    [Column("id")]
    public int Id { get; set; }

    [Column("nome")]
    public string Nome { get; set; } = string.Empty;

    [Column("senha")]
    public string Senha { get; set; } = string.Empty;
}