namespace RenataHair.Application.Validators;

public static class StatusValidation
{
    private static readonly string[] StatusValidos = { "Ativo", "Inativo" };

    public static string? Validar(string status)
    {
        if (!StatusValidos.Contains(status, StringComparer.OrdinalIgnoreCase))
            return "Status inválido. Use: Ativo ou Inativo";

        return null;
    }
}