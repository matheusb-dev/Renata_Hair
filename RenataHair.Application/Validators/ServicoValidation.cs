using RenataHair.Application.DTOs;


namespace RenataHair.Application.Validators;

public static class ServicoValidation
{
    public static string? Validar(ServicoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nome))
            return "Nome é obrigatório";

        if (request.Nome.Trim().Length < 3)
            return "Nome deve ter no mínimo 3 caracteres";

        if (request.Nome.Trim().Length > 250)
            return "Nome deve ter no máximo 250 caracteres";

        if (request.Tempo <= 0)
            return "Tempo deve ser maior que zero";

        if (request.Preco < 0)
            return "Preço inválido";

        return null;
    }
}