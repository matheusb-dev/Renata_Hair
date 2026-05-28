using RenataHair.Domain.Entities;

namespace RenataHair.Domain.Contracts
{
    public interface IAgendamentoRepository
    {
        Task AdicionarAsync(Agendamento agendamento);
        Task AtualizarAsync(Agendamento agendamento);
        Task RemoverAsync(Agendamento agendamento);
        Task<Agendamento?> BuscarPorIdAsync(int id);
        Task<List<Agendamento>> ListarPorDataAsync(DateOnly data);

        Task<bool> ExisteConflitoAsync(
            int funcionarioId,
            DateOnly data,
            TimeOnly horaInicio,
            TimeOnly horaFim,
            int? ignorarId = null);

        Task<bool> ExisteConflitoClienteAsync(
            int clienteId,
            DateOnly data,
            TimeOnly horaInicio,
            TimeOnly horaFim,
            int? ignorarId = null);

        Task<int> TotalMinutosTrabalhadosNoMesAsync(
            int funcionarioId,
            int ano,
            int mes,
            int? ignorarAgendamentoId = null);
    }
}