using RenataHair.Domain.Entities;

namespace RenataHair.Domain.Contracts;

public interface ITokenInvalidadoRepository
{
    Task AdicionarAsync(TokenInvalidado token);
    Task<bool> TokenExisteAsync(string token);
}