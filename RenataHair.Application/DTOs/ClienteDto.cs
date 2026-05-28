namespace RenataHair.Application.DTOs;

public class ClienteRequest
{
    public string Nome { get; set; } = string.Empty;
    public string Cpf { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Plano { get; set; } = "Nenhum";
    public string? TipoMensalidade { get; set; }
    public string? Endereco { get; set; }
}

public class ClienteResponse
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Cpf { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Plano { get; set; } = string.Empty;
    public string? TipoMensalidade { get; set; }
    public string? Endereco { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
}

public class AlterarStatusRequest
{
    public string Status { get; set; } = string.Empty;
}