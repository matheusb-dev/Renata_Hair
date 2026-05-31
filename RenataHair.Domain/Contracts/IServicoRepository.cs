using RenataHair.Domain.Entities;

namespace RenataHair.Domain.Contracts;

public interface IServicoRepository
{
    Task<Servico?> BuscarPorIdAsync(int id);
    Task<List<Servico>> ListarAsync();
    Task AdicionarAsync(Servico servico);
    Task AtualizarAsync(Servico servico);
    Task RemoverAsync(Servico servico);
}