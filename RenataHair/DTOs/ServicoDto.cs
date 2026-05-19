public class ServicoRequest
{
    public string Nome { get; set; } = string.Empty;
    public int Tempo { get; set; }
    public decimal Preco { get; set; }
}

public class ServicoResponse
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public int Tempo { get; set; }
    public decimal Preco { get; set; }
    public DateTime CriadoEm { get; set; }
}