using RenataHair.Domain.Entities;

namespace RenataHair.Domain.Contracts;

public interface IAgendamentoRepository
{
    Task<Agendamento?> BuscarPorIdAsync(int id);
    Task<List<Agendamento>> ListarPorDataAsync(DateOnly data);
    Task AdicionarAsync(Agendamento agendamento);
    Task AtualizarAsync(Agendamento agendamento);
    Task RemoverAsync(Agendamento agendamento);
    Task<bool> ExisteConflitoAsync(int funcionarioId, DateOnly data, TimeOnly horaInicio, TimeOnly horaFim, int? ignorarId = null);
}