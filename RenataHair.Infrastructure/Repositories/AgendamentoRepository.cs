using Microsoft.EntityFrameworkCore;
using RenataHair.Domain.Contracts;
using RenataHair.Domain.Entities;
using RenataHair.Infrastructure.Persistence;

namespace RenataHair.Infrastructure.Repositories
{
    public class AgendamentoRepository : IAgendamentoRepository
    {
        private readonly AppDbContext _context;

        public AgendamentoRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AdicionarAsync(Agendamento agendamento)
        {
            await _context.Agendamentos.AddAsync(agendamento);

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

        public async Task<Agendamento?> BuscarPorIdAsync(int id)
        {
            return await _context.Agendamentos
                .Include(a => a.Cliente)
                .Include(a => a.Funcionario)

                .Include(a => a.Servicos)
                .ThenInclude(s => s.Servico)

                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<List<Agendamento>> ListarPorDataAsync(DateOnly data)
        {
            return await _context.Agendamentos
                .Include(a => a.Cliente)

                .Include(a => a.Funcionario)

                .Include(a => a.Servicos)
                .ThenInclude(s => s.Servico)

                .Where(a => a.Data == data)

                .OrderBy(a => a.HoraInicio)

                .ToListAsync();
        }

        public async Task<bool> ExisteConflitoAsync(
            int funcionarioId,
            DateOnly data,
            TimeOnly horaInicio,
            TimeOnly horaFim,
            int? ignorarId = null)
        {
            return await _context.Agendamentos.AnyAsync(a =>
                a.FuncionarioId == funcionarioId &&
                a.Data == data &&
                (ignorarId == null || a.Id != ignorarId) &&
                horaInicio < a.HoraFim &&
                horaFim > a.HoraInicio
            );
        }

        public async Task<bool> ExisteConflitoClienteAsync(
            int clienteId,
            DateOnly data,
            TimeOnly horaInicio,
            TimeOnly horaFim,
            int? ignorarId = null)
        {
            return await _context.Agendamentos.AnyAsync(a =>
                a.ClienteId == clienteId &&
                a.Data == data &&
                (ignorarId == null || a.Id != ignorarId) &&
                horaInicio < a.HoraFim &&
                horaFim > a.HoraInicio
            );
        }

        public async Task<int> TotalMinutosTrabalhadosNoMesAsync(
            int funcionarioId,
            int ano,
            int mes,
            int? ignorarAgendamentoId = null)
        {
            var agendamentos = await _context.Agendamentos
                .Where(a =>
                    a.FuncionarioId == funcionarioId &&
                    a.Data.Year == ano &&
                    a.Data.Month == mes &&
                    (ignorarAgendamentoId == null ||
                     a.Id != ignorarAgendamentoId))

                .Select(a => new
                {
                    a.HoraInicio,
                    a.HoraFim
                })

                .ToListAsync();

            return agendamentos.Sum(a =>
                (int)
                (
                    a.HoraFim.ToTimeSpan() -
                    a.HoraInicio.ToTimeSpan()
                ).TotalMinutes);
        }
    }
}