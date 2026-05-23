using Microsoft.EntityFrameworkCore;
using RenataHair.Domain.Contracts;
using RenataHair.Domain.Entities;
using RenataHair.Infrastructure.Persistence;

namespace RenataHair.Infrastructure.Repositories;

public class AgendamentoRepository : IAgendamentoRepository
{
    private readonly AppDbContext _context;

    public AgendamentoRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Agendamento?> BuscarPorIdAsync(int id)
    {
        return await _context.Agendamentos
            .Include(a => a.Cliente)
            .Include(a => a.Funcionario)
            .Include(a => a.Servico)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<List<Agendamento>> ListarPorDataAsync(DateOnly data)
    {
        return await _context.Agendamentos
            .Include(a => a.Cliente)
            .Include(a => a.Funcionario)
            .Include(a => a.Servico)
            .Where(a => a.Data == data)
            .OrderBy(a => a.HoraInicio)
            .ToListAsync();
    }

    public async Task AdicionarAsync(Agendamento agendamento)
    {
        _context.Agendamentos.Add(agendamento);
        await _context.SaveChangesAsync();
    }

    public async Task AtualizarAsync(Agendamento agendamento)
    {
        _context.Agendamentos.Update(agendamento);
        await _context.SaveChangesAsync();
    }

    public async Task RemoverAsync(Agendamento agendamento)
    {
        _context.Agendamentos.Remove(agendamento);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExisteConflitoAsync(int funcionarioId, DateOnly data, TimeOnly horaInicio, TimeOnly horaFim, int? ignorarId = null)
    {
        return await _context.Agendamentos
            .AnyAsync(a =>
                a.FuncionarioId == funcionarioId &&
                a.Data == data &&
                a.HoraInicio < horaFim &&
                a.HoraFim > horaInicio &&
                (ignorarId == null || a.Id != ignorarId));
    }
}