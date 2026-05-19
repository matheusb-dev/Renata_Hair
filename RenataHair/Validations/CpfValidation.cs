public static class CpfValidation
{
    public static string? Validar(string cpf)
    {
        cpf = new string(cpf.Where(char.IsDigit).ToArray());

        if (cpf.Length != 11)
            return "CPF deve conter 11 dígitos";

        if (cpf.All(c => c == cpf[0]))
            return "CPF inválido";

        var soma = 0;
        for (int i = 0; i < 9; i++)
            soma += int.Parse(cpf[i].ToString()) * (10 - i);

        var resto = soma % 11;
        var digito1 = resto < 2 ? 0 : 11 - resto;
        if (int.Parse(cpf[9].ToString()) != digito1)
            return "CPF inválido";

        soma = 0;
        for (int i = 0; i < 10; i++)
            soma += int.Parse(cpf[i].ToString()) * (11 - i);

        resto = soma % 11;
        var digito2 = resto < 2 ? 0 : 11 - resto;
        if (int.Parse(cpf[10].ToString()) != digito2)
            return "CPF inválido";

        return null;
    }
}