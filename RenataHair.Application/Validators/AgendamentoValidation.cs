using RenataHair.Application.DTOs;

namespace RenataHair.Application.Validators;

public static class AgendamentoValidation
{
    public static string? Validar(AgendamentoRequest request)
    {
        if (request.ClienteId <= 0)
            return "Cliente é obrigatório";

        if (request.FuncionarioId <= 0)
            return "Funcionário é obrigatório";

        if (request.ServicosIds == null || !request.ServicosIds.Any())
            return "Pelo menos um serviço deve ser informado";

        if (request.ServicosIds.Any(s => s <= 0))
            return "Existem serviços inválidos";

        if (string.IsNullOrWhiteSpace(request.Data))
            return "Data é obrigatória";

        if (!DateOnly.TryParse(request.Data, out var data))
            return "Formato de data inválido";

        if (data < DateOnly.FromDateTime(DateTime.Today))
            return "Não é permitido agendar em datas passadas";

        if (string.IsNullOrWhiteSpace(request.HoraInicio))
            return "Hora de início é obrigatória";

        if (!TimeOnly.TryParse(request.HoraInicio, out var horaInicio))
            return "Formato de hora inválido";

        // Se a data for hoje, a hora não pode ser no passado
        if (data == DateOnly.FromDateTime(DateTime.Today))
        {
            var horaAtual = TimeOnly.FromDateTime(DateTime.Now.ToLocalTime());

            if (horaInicio < horaAtual)
                return "Não é permitido agendar em horários que já passaram";
        }

        return null;
    }
}