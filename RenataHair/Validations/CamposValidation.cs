public static class CamposValidation
{
    public static string? Validar(ClienteRequest request)
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

        return null;
    }
}