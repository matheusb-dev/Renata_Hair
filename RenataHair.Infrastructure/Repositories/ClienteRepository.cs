using Microsoft.EntityFrameworkCore;
using RenataHair.Domain.Contracts;
using RenataHair.Domain.Entities;
using RenataHair.Infrastructure.Persistence;

namespace RenataHair.Infrastructure.Repositories;

public class ClienteRepository : IClienteRepository
{
    private readonly AppDbContext _context;

    public ClienteRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Cliente?> BuscarPorIdAsync(int id)
    {
        return await _context.Clientes.FindAsync(id);
    }

    public async Task<Cliente?> BuscarPorCpfAsync(string cpf)
    {
        return await _context.Clientes
            .FirstOrDefaultAsync(c => c.Cpf == cpf);
    }

    public async Task<List<Cliente>> ListarTodosAsync()
    {
        return await _context.Clientes.ToListAsync();
    }

    public async Task<List<Cliente>> ListarAsync(string? nome, string? cpf)
    {
        var query = _context.Clientes.AsQueryable();

        if (!string.IsNullOrWhiteSpace(nome))
            query = query.Where(c => c.Nome.ToLower().Contains(nome.ToLower()));

        if (!string.IsNullOrWhiteSpace(cpf))
            query = query.Where(c => c.Cpf == cpf);

        return await query.ToListAsync();
    }

    public async Task AdicionarAsync(Cliente cliente)
    {
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();
    }

    public async Task AtualizarAsync(Cliente cliente)
    {
        _context.Clientes.Update(cliente);
        await _context.SaveChangesAsync();
    }

    public async Task RemoverAsync(Cliente cliente)
    {
        _context.Clientes.Remove(cliente);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> CpfExisteAsync(string cpf, int? ignorarId = null)
    {
        return await _context.Clientes
            .AnyAsync(c => c.Cpf == cpf &&
                     (ignorarId == null || c.Id != ignorarId));
    }
}