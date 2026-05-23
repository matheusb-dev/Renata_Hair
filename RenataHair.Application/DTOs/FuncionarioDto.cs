namespace RenataHair.Application.DTOs;

public class FuncionarioRequest
{
    public string Nome { get; set; } = string.Empty;
    public string Cpf { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Endereco { get; set; }
    public string Turno { get; set; } = string.Empty;
    public int? HorasMensais { get; set; }
    public bool Pj { get; set; } = false;
    public bool CadastrarComoCliente { get; set; } = false;
}

public class FuncionarioResponse
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Cpf { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Endereco { get; set; }
    public string Turno { get; set; } = string.Empty;
    public int? HorasMensais { get; set; }
    public bool Pj { get; set; }
    public DateTime CriadoEm { get; set; }
}