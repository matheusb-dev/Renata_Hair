using Microsoft.EntityFrameworkCore;
using RenataHair.Domain.Contracts;
using RenataHair.Domain.Entities;
using RenataHair.Infrastructure.Persistence;

namespace RenataHair.Infrastructure.Repositories;

public class ServicoRepository : IServicoRepository
{
    private readonly AppDbContext _context;

    public ServicoRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Servico?> BuscarPorIdAsync(int id)
    {
        return await _context.Servicos.FindAsync(id);
    }

    public async Task<List<Servico>> ListarAsync()
    {
        return await _context.Servicos
            .OrderBy(s => s.Nome)
            .ToListAsync();
    }

    public async Task AdicionarAsync(Servico servico)
    {
        _context.Servicos.Add(servico);
        await _context.SaveChangesAsync();
    }

    public async Task AtualizarAsync(Servico servico)
    {
        _context.Servicos.Update(servico);
        await _context.SaveChangesAsync();
    }

    public async Task RemoverAsync(Servico servico)
    {
        _context.Servicos.Remove(servico);
        await _context.SaveChangesAsync();
    }
}