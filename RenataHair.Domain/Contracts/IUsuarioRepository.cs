using RenataHair.Domain.Entities;

namespace RenataHair.Domain.Contracts;

public interface IUsuarioRepository
{
    Task<Usuario?> BuscarPorNomeAsync(string nome);
}