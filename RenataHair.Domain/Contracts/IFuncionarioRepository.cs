using RenataHair.Domain.Entities;

namespace RenataHair.Domain.Contracts;

public interface IFuncionarioRepository
{
    Task<Funcionario?> BuscarPorIdAsync(int id);
    Task<Funcionario?> BuscarPorCpfAsync(string cpf);
    Task<List<Funcionario>> ListarTodosAsync();
    Task<List<Funcionario>> ListarAsync(string? nome, string? cpf, string? turno);
    Task AdicionarAsync(Funcionario funcionario);
    Task AtualizarAsync(Funcionario funcionario);
    Task RemoverAsync(Funcionario funcionario);
    Task<bool> CpfExisteAsync(string cpf, int? ignorarId = null);
}