using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RenataHair.Domain.Entities;

[Table("tokens_invalidados")]
public class TokenInvalidado
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("token")]
    public string Token { get; set; } = string.Empty;

    [Column("invalidado_em")]
    public DateTime InvalidadoEm { get; set; } = DateTime.UtcNow;
}