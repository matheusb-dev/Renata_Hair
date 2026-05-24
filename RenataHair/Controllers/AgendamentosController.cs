using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RenataHair.Application.DTOs;
using RenataHair.Application.Validators;
using RenataHair.Domain.Contracts;
using RenataHair.Domain.Entities;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AgendamentosController : ControllerBase
{
    private readonly IAgendamentoRepository _agendamentoRepository;
    private readonly IClienteRepository _clienteRepository;
    private readonly IFuncionarioRepository _funcionarioRepository;
    private readonly IServicoRepository _servicoRepository;

    public AgendamentosController(
        IAgendamentoRepository agendamentoRepository,
        IClienteRepository clienteRepository,
        IFuncionarioRepository funcionarioRepository,
        IServicoRepository servicoRepository)
    {
        _agendamentoRepository = agendamentoRepository;
        _clienteRepository = clienteRepository;
        _funcionarioRepository = funcionarioRepository;
        _servicoRepository = servicoRepository;
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] AgendamentoRequest request)
    {
        try
        {
            var erro = AgendamentoValidation.Validar(request);

            if (erro != null)
                return erro.Contains("datas passadas")
                    ? UnprocessableEntity(new { message = erro })
                    : BadRequest(new { message = erro });

            var cliente = await _clienteRepository.BuscarPorIdAsync(request.ClienteId);

            if (cliente == null)
                return NotFound(new { message = "Cliente não encontrado" });

            var funcionario = await _funcionarioRepository.BuscarPorIdAsync(request.FuncionarioId);

            if (funcionario == null)
                return NotFound(new { message = "Funcionário não encontrado" });

            if (cliente.Cpf == funcionario.Cpf)
                return BadRequest(new { message = "Cliente e funcionário não podem ser a mesma pessoa" });

            var horaInicio = TimeOnly.Parse(request.HoraInicio);

            if (!funcionario.Pj)
            {
                var turnoValido = funcionario.Turno.ToLower() switch
                {
                    "manhã" => horaInicio >= new TimeOnly(6, 0) && horaInicio < new TimeOnly(12, 0),
                    "tarde" => horaInicio >= new TimeOnly(12, 0) && horaInicio < new TimeOnly(18, 0),
                    "noite" => horaInicio >= new TimeOnly(18, 0) && horaInicio <= new TimeOnly(23, 59),
                    _ => false
                };

                if (!turnoValido)
                    return BadRequest(new { message = $"Funcionário só pode ser agendado no turno {funcionario.Turno}" });
            }

            var servico = await _servicoRepository.BuscarPorIdAsync(request.ServicoId);

            if (servico == null)
                return NotFound(new { message = "Serviço não encontrado" });

            var data = DateOnly.Parse(request.Data);
            var horaFim = horaInicio.AddMinutes(servico.Tempo);

            // ── VERIFICAÇÃO DE HORAS MENSAIS ──────────────────────────
            if (!funcionario.Pj && funcionario.HorasMensais.HasValue)
            {
                var minutosJaTrabalhados = await _agendamentoRepository
                    .TotalMinutosTrabalhadosNoMesAsync(
                        request.FuncionarioId,
                        data.Year,
                        data.Month);

                var limiteMinutos = funcionario.HorasMensais.Value * 60;

                if (minutosJaTrabalhados + servico.Tempo > limiteMinutos)
                {
                    var horasRestantes = (limiteMinutos - minutosJaTrabalhados) / 60m;
                    return UnprocessableEntity(new
                    {
                        message = $"Funcionário atingiu o limite de horas mensais. " +
                                  $"Restam {horasRestantes:F1}h disponíveis neste mês."
                    });
                }
            }
            // ─────────────────────────────────────────────────────────

            // CONFLITO FUNCIONÁRIO
            var conflitoFuncionario = await _agendamentoRepository.ExisteConflitoAsync(
                request.FuncionarioId, data, horaInicio, horaFim);

            if (conflitoFuncionario)
                return Conflict(new { message = "Horário indisponível para este funcionário" });

            // CONFLITO CLIENTE
            var conflitoCliente = await _agendamentoRepository.ExisteConflitoClienteAsync(
                request.ClienteId, data, horaInicio, horaFim);

            if (conflitoCliente)
                return Conflict(new { message = "Cliente já possui agendamento neste horário" });

            var agendamento = new Agendamento
            {
                ClienteId = request.ClienteId,
                FuncionarioId = request.FuncionarioId,
                ServicoId = request.ServicoId,
                Data = data,
                HoraInicio = horaInicio,
                HoraFim = horaFim,
                Total = servico.Preco,
                CriadoEm = DateTime.UtcNow
            };

            await _agendamentoRepository.AdicionarAsync(agendamento);

            return CreatedAtAction(nameof(BuscarPorId), new { id = agendamento.Id },
                new AgendamentoResponse
                {
                    Id = agendamento.Id,
                    ClienteId = agendamento.ClienteId,
                    FuncionarioId = agendamento.FuncionarioId,
                    ServicoId = agendamento.ServicoId,
                    Cliente = cliente.Nome,
                    Funcionario = funcionario.Nome,
                    Servico = servico.Nome,
                    Data = agendamento.Data.ToString("yyyy-MM-dd"),
                    HoraInicio = agendamento.HoraInicio.ToString("HH:mm"),
                    HoraFim = agendamento.HoraFim.ToString("HH:mm"),
                    Total = agendamento.Total
                });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? data)
    {
        try
        {
            DateOnly dataFiltro;

            if (string.IsNullOrWhiteSpace(data))
                dataFiltro = DateOnly.FromDateTime(DateTime.Today);
            else if (!DateOnly.TryParse(data, out dataFiltro))
                return BadRequest(new { message = "Formato de data inválido" });

            var agendamentos = await _agendamentoRepository.ListarPorDataAsync(dataFiltro);

            var resultado = agendamentos.Select(a => new AgendamentoResponse
            {
                Id = a.Id,
                ClienteId = a.ClienteId,
                FuncionarioId = a.FuncionarioId,
                ServicoId = a.ServicoId,
                Cliente = a.Cliente?.Nome ?? "",
                Funcionario = a.Funcionario?.Nome ?? "",
                Servico = a.Servico?.Nome ?? "",
                Data = a.Data.ToString("yyyy-MM-dd"),
                HoraInicio = a.HoraInicio.ToString("HH:mm"),
                HoraFim = a.HoraFim.ToString("HH:mm"),
                Total = a.Total
            }).ToList();

            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> BuscarPorId(int id)
    {
        try
        {
            var agendamento = await _agendamentoRepository.BuscarPorIdAsync(id);

            if (agendamento == null)
                return NotFound(new { message = "Agendamento não encontrado" });

            return Ok(new AgendamentoResponse
            {
                Id = agendamento.Id,
                ClienteId = agendamento.ClienteId,
                FuncionarioId = agendamento.FuncionarioId,
                ServicoId = agendamento.ServicoId,
                Cliente = agendamento.Cliente?.Nome ?? "",
                Funcionario = agendamento.Funcionario?.Nome ?? "",
                Servico = agendamento.Servico?.Nome ?? "",
                Data = agendamento.Data.ToString("yyyy-MM-dd"),
                HoraInicio = agendamento.HoraInicio.ToString("HH:mm"),
                HoraFim = agendamento.HoraFim.ToString("HH:mm"),
                Total = agendamento.Total
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] AgendamentoRequest request)
    {
        try
        {
            var agendamento = await _agendamentoRepository.BuscarPorIdAsync(id);

            if (agendamento == null)
                return NotFound(new { message = "Agendamento não encontrado" });

            var erro = AgendamentoValidation.Validar(request);

            if (erro != null)
                return erro.Contains("datas passadas")
                    ? UnprocessableEntity(new { message = erro })
                    : BadRequest(new { message = erro });

            var cliente = await _clienteRepository.BuscarPorIdAsync(request.ClienteId);

            if (cliente == null)
                return NotFound(new { message = "Cliente não encontrado" });

            var funcionario = await _funcionarioRepository.BuscarPorIdAsync(request.FuncionarioId);

            if (funcionario == null)
                return NotFound(new { message = "Funcionário não encontrado" });

            if (cliente.Cpf == funcionario.Cpf)
                return BadRequest(new { message = "Cliente e funcionário não podem ser a mesma pessoa" });

            var horaInicio = TimeOnly.Parse(request.HoraInicio);

            if (!funcionario.Pj)
            {
                var turnoValido = funcionario.Turno.ToLower() switch
                {
                    "manhã" => horaInicio >= new TimeOnly(6, 0) && horaInicio < new TimeOnly(12, 0),
                    "tarde" => horaInicio >= new TimeOnly(12, 0) && horaInicio < new TimeOnly(18, 0),
                    "noite" => horaInicio >= new TimeOnly(18, 0) && horaInicio <= new TimeOnly(23, 59),
                    _ => false
                };

                if (!turnoValido)
                    return BadRequest(new { message = $"Funcionário só pode ser agendado no turno {funcionario.Turno}" });
            }

            var servico = await _servicoRepository.BuscarPorIdAsync(request.ServicoId);

            if (servico == null)
                return NotFound(new { message = "Serviço não encontrado" });

            var data = DateOnly.Parse(request.Data);
            var horaFim = horaInicio.AddMinutes(servico.Tempo);

            // ── VERIFICAÇÃO DE HORAS MENSAIS ──────────────────────────
            if (!funcionario.Pj && funcionario.HorasMensais.HasValue)
            {
                // passa o id atual para não contar ele mesmo na soma
                var minutosJaTrabalhados = await _agendamentoRepository
                    .TotalMinutosTrabalhadosNoMesAsync(
                        request.FuncionarioId,
                        data.Year,
                        data.Month,
                        ignorarAgendamentoId: id);

                var limiteMinutos = funcionario.HorasMensais.Value * 60;

                if (minutosJaTrabalhados + servico.Tempo > limiteMinutos)
                {
                    var horasRestantes = (limiteMinutos - minutosJaTrabalhados) / 60m;
                    return UnprocessableEntity(new
                    {
                        message = $"Funcionário atingiu o limite de horas mensais. " +
                                  $"Restam {horasRestantes:F1}h disponíveis neste mês."
                    });
                }
            }
            // ─────────────────────────────────────────────────────────

            // CONFLITO FUNCIONÁRIO
            var conflitoFuncionario = await _agendamentoRepository.ExisteConflitoAsync(
                request.FuncionarioId, data, horaInicio, horaFim, id);

            if (conflitoFuncionario)
                return Conflict(new { message = "Horário indisponível para este funcionário" });

            // CONFLITO CLIENTE
            var conflitoCliente = await _agendamentoRepository.ExisteConflitoClienteAsync(
                request.ClienteId, data, horaInicio, horaFim, id);

            if (conflitoCliente)
                return Conflict(new { message = "Cliente já possui agendamento neste horário" });

            agendamento.ClienteId = request.ClienteId;
            agendamento.FuncionarioId = request.FuncionarioId;
            agendamento.ServicoId = request.ServicoId;
            agendamento.Data = data;
            agendamento.HoraInicio = horaInicio;
            agendamento.HoraFim = horaFim;
            agendamento.Total = servico.Preco;

            await _agendamentoRepository.AtualizarAsync(agendamento);

            return Ok(new { message = "Agendamento atualizado com sucesso" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(int id)
    {
        try
        {
            var agendamento = await _agendamentoRepository.BuscarPorIdAsync(id);

            if (agendamento == null)
                return NotFound(new { message = "Agendamento não encontrado" });

            await _agendamentoRepository.RemoverAsync(agendamento);

            return Ok(new { message = "Agendamento removido com sucesso" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, inner = ex.InnerException?.Message });
        }
    }
}