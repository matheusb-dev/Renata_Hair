using Microsoft.EntityFrameworkCore;
using RenataHair.Domain.Contracts;
using RenataHair.Domain.Entities;
using RenataHair.Infrastructure.Persistence;

namespace RenataHair.Infrastructure.Repositories;

public class FuncionarioRepository : IFuncionarioRepository
{
    private readonly AppDbContext _context;

    public FuncionarioRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Funcionario?> BuscarPorIdAsync(int id)
    {
        return await _context.Funcionarios
            .Include(f => f.Servicos)
            .FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<Funcionario?> BuscarPorCpfAsync(string cpf)
    {
        return await _context.Funcionarios
            .Include(f => f.Servicos)
            .FirstOrDefaultAsync(f => f.Cpf == cpf);
    }

    public async Task<List<Funcionario>> ListarTodosAsync()
    {
        return await _context.Funcionarios
            .Include(f => f.Servicos)
            .ToListAsync();
    }

    public async Task<List<Funcionario>> ListarAsync(
        string? nome,
        string? cpf,
        string? turno)
    {
        var query = _context.Funcionarios
            .Include(f => f.Servicos)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(nome))
        {
            query = query.Where(f =>
                f.Nome.ToLower().Contains(nome.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(cpf))
        {
            query = query.Where(f => f.Cpf == cpf);
        }

        if (!string.IsNullOrWhiteSpace(turno))
        {
            query = query.Where(f =>
                f.Turno.ToLower() == turno.ToLower());
        }

        return await query.ToListAsync();
    }

    public async Task AdicionarAsync(Funcionario funcionario)
    {
        _context.Funcionarios.Add(funcionario);

        await _context.SaveChangesAsync();
    }

    public async Task AtualizarAsync(Funcionario funcionario)
    {
        _context.Funcionarios.Update(funcionario);

        await _context.SaveChangesAsync();
    }

    public async Task RemoverAsync(Funcionario funcionario)
    {
        _context.Funcionarios.Remove(funcionario);

        await _context.SaveChangesAsync();
    }

    public async Task<bool> CpfExisteAsync(
        string cpf,
        int? ignorarId = null)
    {
        return await _context.Funcionarios
            .AnyAsync(f =>
                f.Cpf == cpf &&
                (ignorarId == null || f.Id != ignorarId));
    }
}