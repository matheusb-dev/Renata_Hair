using RenataHair.Domain.Entities;

namespace RenataHair.Domain.Contracts;

public interface IClienteRepository
{
    Task<Cliente?> BuscarPorIdAsync(int id);
    Task<Cliente?> BuscarPorCpfAsync(string cpf);
    Task<List<Cliente>> ListarTodosAsync();
    Task<List<Cliente>> ListarAsync(string? nome, string? cpf);
    Task AdicionarAsync(Cliente cliente);
    Task AtualizarAsync(Cliente cliente);
    Task RemoverAsync(Cliente cliente);
    Task<bool> CpfExisteAsync(string cpf, int? ignorarId = null);
}