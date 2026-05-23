using Microsoft.EntityFrameworkCore;
using RenataHair.Domain.Contracts;
using RenataHair.Domain.Entities;
using RenataHair.Infrastructure.Persistence;

namespace RenataHair.Infrastructure.Repositories;

public class TokenInvalidadoRepository : ITokenInvalidadoRepository
{
    private readonly AppDbContext _context;

    public TokenInvalidadoRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AdicionarAsync(TokenInvalidado token)
    {
        _context.TokensInvalidados.Add(token);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> TokenExisteAsync(string token)
    {
        return await _context.TokensInvalidados
            .AnyAsync(t => t.Token == token);
    }
}