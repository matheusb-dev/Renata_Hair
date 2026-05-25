namespace RenataHair.Application.DTOs;

public class AgendamentoRequest
{
    public int ClienteId { get; set; }

    public int FuncionarioId { get; set; }

    public List<int> ServicosIds { get; set; } = new();

    public string Data { get; set; } = string.Empty;

    public string HoraInicio { get; set; } = string.Empty;
}

public class AgendamentoResponse
{
    public int Id { get; set; }

    public int ClienteId { get; set; }

    public int FuncionarioId { get; set; }

    public List<string> Servicos { get; set; } = new();

    public string Cliente { get; set; } = string.Empty;

    public string Funcionario { get; set; } = string.Empty;

    public string Data { get; set; } = string.Empty;

    public string HoraInicio { get; set; } = string.Empty;

    public string HoraFim { get; set; } = string.Empty;

    public decimal Total { get; set; }
}