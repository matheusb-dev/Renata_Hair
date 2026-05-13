using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("usuarios")]
public class Usuario
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("usuario")] 
    public string Nome { get; set; } = string.Empty;

    [Required]
    [Column("senha")]
    public string Senha { get; set; } = string.Empty;
}