using System.ComponentModel.DataAnnotations;
namespace RenataHair.DTOs
{
    public class LoginRequestDto
    {
        public string Nome { get; set; }

        [DataType(DataType.Password)]
        public string Senha { get; set; }
    }
}
