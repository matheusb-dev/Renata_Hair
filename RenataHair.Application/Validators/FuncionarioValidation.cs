using RenataHair.Application.DTOs;

namespace RenataHair.Application.Validators;

public static class FuncionarioValidation
{
    private static readonly string[] TurnosValidos = { "Manhã", "Tarde", "Noite" };

    public static string? Validar(FuncionarioRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nome))
            return "Nome é obrigatório";

        if (request.Nome.Any(char.IsDigit))
            return "Nome não pode conter números";

        if (request.Nome.Trim().Length > 250)
            return "Nome deve ter no máximo 250 caracteres";

        if (string.IsNullOrWhiteSpace(request.Cpf))
            return "CPF é obrigatório";

        if (request.Cpf.Any(char.IsLetter))
            return "CPF não pode conter letras";

        if (string.IsNullOrWhiteSpace(request.Telefone))
            return "Telefone é obrigatório";

        if (request.Telefone.Any(char.IsLetter))
            return "Telefone não pode conter letras";

        var telefoneNumeros = new string(request.Telefone.Where(char.IsDigit).ToArray());
        if (telefoneNumeros.Length < 10 || telefoneNumeros.Length > 11)
            return "Telefone deve ter 10 ou 11 dígitos (ex: 44999074397)";

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var email = request.Email.Trim();
            var atIndex = email.IndexOf('@');

            if (atIndex <= 0)
                return "Email inválido";

            var dominio = email.Substring(atIndex + 1);
            if (!dominio.Contains('.') || dominio.StartsWith('.') || dominio.EndsWith('.'))
                return "Email inválido";

            if (email.Length > 250)
                return "Email deve ter no máximo 250 caracteres";
        }

        if (!string.IsNullOrWhiteSpace(request.Endereco) && request.Endereco.Trim().Length > 250)
            return "Endereço deve ter no máximo 250 caracteres";

        if (string.IsNullOrWhiteSpace(request.Turno))
            return "Turno é obrigatório";

        var turnosSelecionados = request.Turno
            .Split(',')
            .Select(t => t.Trim())
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .ToList();

        if (turnosSelecionados.Count == 0 || turnosSelecionados.Count > 2)
            return "Selecione entre 1 e 2 turnos";

        if (turnosSelecionados.Any(t => !TurnosValidos.Contains(t, StringComparer.OrdinalIgnoreCase)))
            return "Turno inválido. Use: Manhã, Tarde ou Noite";

        if (request.HorasMensais.HasValue)
        {
            if (request.HorasMensais <= 0)
                return "Horas mensais deve ser maior que zero";
        }

        return null;
    }
}