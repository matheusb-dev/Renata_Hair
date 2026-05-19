public static class PlanoValidation
{
    private static readonly string[] PlanosValidos = { "Nenhum", "Premium" };
    private static readonly string[] MensalidadesValidas = { "Mensal", "Anual" };

    public static string? Validar(ClienteRequest request)
    {
        var plano = request.Plano?.Trim();

        if (string.IsNullOrWhiteSpace(plano))
            return "Plano é obrigatório";

        if (!PlanosValidos.Contains(plano, StringComparer.OrdinalIgnoreCase))
            return "Plano inválido. Use: Nenhum ou Premium";

        if (string.Equals(plano, "Premium", StringComparison.OrdinalIgnoreCase))
        {
            var mensalidade = request.TipoMensalidade?.Trim();

            if (string.IsNullOrWhiteSpace(mensalidade))
                return "Tipo de mensalidade obrigatório para plano Premium";

            if (!MensalidadesValidas.Contains(mensalidade, StringComparer.OrdinalIgnoreCase))
                return "Tipo de mensalidade inválido. Use: Mensal ou Anual";
        }

        return null;
    }
}