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

            var cliente =
                await _clienteRepository.BuscarPorIdAsync(request.ClienteId);

            if (cliente == null)
                return NotFound(new { message = "Cliente não encontrado" });

            // ✅ Bloqueia agendamento com cliente inativo
            if (cliente.Status != "Ativo")
                return UnprocessableEntity(new
                {
                    message = "Não é possível agendar com um cliente inativo"
                });

            var funcionario =
                await _funcionarioRepository.BuscarPorIdAsync(request.FuncionarioId);

            if (funcionario == null)
                return NotFound(new { message = "Funcionário não encontrado" });

            if (cliente.Cpf == funcionario.Cpf)
                return BadRequest(new
                {
                    message = "Cliente e funcionário não podem ser a mesma pessoa"
                });

            var horaInicio = TimeOnly.Parse(request.HoraInicio);

            if (!funcionario.Pj)
            {
                var turnoValido = funcionario.Turno.ToLower() switch
                {
                    "manhã" =>
                        horaInicio >= new TimeOnly(6, 0) &&
                        horaInicio < new TimeOnly(12, 0),
                    "tarde" =>
                        horaInicio >= new TimeOnly(12, 0) &&
                        horaInicio < new TimeOnly(18, 0),
                    "noite" =>
                        horaInicio >= new TimeOnly(18, 0) &&
                        horaInicio <= new TimeOnly(23, 59),
                    _ => false
                };

                if (!turnoValido)
                    return BadRequest(new
                    {
                        message = $"Funcionário só pode ser agendado no turno {funcionario.Turno}"
                    });
            }

            var servicos = new List<Servico>();

            foreach (var servicoId in request.ServicosIds)
            {
                var servico = await _servicoRepository.BuscarPorIdAsync(servicoId);

                if (servico == null)
                    return NotFound(new { message = $"Serviço {servicoId} não encontrado" });

                var funcionarioRealizaServico =
                    funcionario.Servicos.Any(s => s.Id == servicoId);

                if (!funcionarioRealizaServico)
                    return BadRequest(new
                    {
                        message = $"Funcionário não realiza o serviço {servico.Nome}"
                    });

                servicos.Add(servico);
            }

            var tempoTotal = servicos.Sum(s => s.Tempo);
            var valorTotal = servicos.Sum(s => s.Preco);
            var data = DateOnly.Parse(request.Data);
            var horaFim = horaInicio.AddMinutes(tempoTotal);

            // HORAS MENSAIS
            if (!funcionario.Pj && funcionario.HorasMensais.HasValue)
            {
                var minutosJaTrabalhados =
                    await _agendamentoRepository
                        .TotalMinutosTrabalhadosNoMesAsync(
                            request.FuncionarioId,
                            data.Year,
                            data.Month);

                var limiteMinutos = funcionario.HorasMensais.Value * 60;

                if (minutosJaTrabalhados + tempoTotal > limiteMinutos)
                {
                    var horasRestantes = (limiteMinutos - minutosJaTrabalhados) / 60m;

                    return UnprocessableEntity(new
                    {
                        message =
                            $"Funcionário atingiu o limite de horas mensais. " +
                            $"Restam {horasRestantes:F1}h disponíveis neste mês."
                    });
                }
            }

            // CONFLITO FUNCIONÁRIO
            var conflitoFuncionario =
                await _agendamentoRepository.ExisteConflitoAsync(
                    request.FuncionarioId, data, horaInicio, horaFim);

            if (conflitoFuncionario)
                return Conflict(new { message = "Horário indisponível para este funcionário" });

            // CONFLITO CLIENTE
            var conflitoCliente =
                await _agendamentoRepository.ExisteConflitoClienteAsync(
                    request.ClienteId, data, horaInicio, horaFim);

            if (conflitoCliente)
                return Conflict(new { message = "Cliente já possui agendamento neste horário" });

            // FUNCIONÁRIO COMO CLIENTE
            var conflitoFuncionarioComoCliente =
                await _agendamentoRepository.ExisteConflitoClienteAsync(
                    request.FuncionarioId, data, horaInicio, horaFim);

            if (conflitoFuncionarioComoCliente)
                return Conflict(new
                {
                    message = "Funcionário já possui um agendamento como cliente neste horário"
                });

            // CLIENTE COMO FUNCIONÁRIO
            var conflitoClienteComoFuncionario =
                await _agendamentoRepository.ExisteConflitoAsync(
                    request.ClienteId, data, horaInicio, horaFim);

            if (conflitoClienteComoFuncionario)
                return Conflict(new
                {
                    message = "Cliente já está como funcionário em um agendamento neste horário"
                });

            var agendamento = new Agendamento
            {
                ClienteId = request.ClienteId,
                FuncionarioId = request.FuncionarioId,
                Data = data,
                HoraInicio = horaInicio,
                HoraFim = horaFim,
                Total = valorTotal,
                CriadoEm = DateTime.UtcNow
            };

            foreach (var servico in servicos)
            {
                agendamento.Servicos.Add(new AgendamentoServico
                {
                    ServicoId = servico.Id,
                    Preco = servico.Preco,
                    Tempo = servico.Tempo
                });
            }

            await _agendamentoRepository.AdicionarAsync(agendamento);

            return CreatedAtAction(
                nameof(BuscarPorId),
                new { id = agendamento.Id },
                new AgendamentoResponse
                {
                    Id = agendamento.Id,
                    ClienteId = agendamento.ClienteId,
                    FuncionarioId = agendamento.FuncionarioId,
                    Cliente = cliente.Nome,
                    Funcionario = funcionario.Nome,
                    Servicos = servicos.Select(s => s.Nome).ToList(),
                    Data = agendamento.Data.ToString("yyyy-MM-dd"),
                    HoraInicio = agendamento.HoraInicio.ToString("HH:mm"),
                    HoraFim = agendamento.HoraFim.ToString("HH:mm"),
                    Total = agendamento.Total
                });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = ex.Message,
                inner = ex.InnerException?.Message
            });
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

            var agendamentos =
                await _agendamentoRepository.ListarPorDataAsync(dataFiltro);

            var resultado = agendamentos.Select(a => new AgendamentoResponse
            {
                Id = a.Id,
                ClienteId = a.ClienteId,
                FuncionarioId = a.FuncionarioId,
                Cliente = a.Cliente?.Nome ?? "",
                Funcionario = a.Funcionario?.Nome ?? "",
                Servicos = a.Servicos.Select(s => s.Servico!.Nome).ToList(),
                Data = a.Data.ToString("yyyy-MM-dd"),
                HoraInicio = a.HoraInicio.ToString("HH:mm"),
                HoraFim = a.HoraFim.ToString("HH:mm"),
                Total = a.Total
            }).ToList();

            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = ex.Message,
                inner = ex.InnerException?.Message
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> BuscarPorId(int id)
    {
        try
        {
            var agendamento =
                await _agendamentoRepository.BuscarPorIdAsync(id);

            if (agendamento == null)
                return NotFound(new { message = "Agendamento não encontrado" });

            return Ok(new AgendamentoResponse
            {
                Id = agendamento.Id,
                ClienteId = agendamento.ClienteId,
                FuncionarioId = agendamento.FuncionarioId,
                Cliente = agendamento.Cliente?.Nome ?? "",
                Funcionario = agendamento.Funcionario?.Nome ?? "",
                Servicos = agendamento.Servicos.Select(s => s.Servico!.Nome).ToList(),
                Data = agendamento.Data.ToString("yyyy-MM-dd"),
                HoraInicio = agendamento.HoraInicio.ToString("HH:mm"),
                HoraFim = agendamento.HoraFim.ToString("HH:mm"),
                Total = agendamento.Total
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = ex.Message,
                inner = ex.InnerException?.Message
            });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Editar(int id, [FromBody] AgendamentoRequest request)
    {
        try
        {
            // 1. Busca o agendamento existente
            var agendamentoExistente =
                await _agendamentoRepository.BuscarPorIdAsync(id);

            if (agendamentoExistente == null)
                return NotFound(new { message = "Agendamento não encontrado" });

            // 2. Validações básicas do request
            var erro = AgendamentoValidation.Validar(request);
            if (erro != null)
                return erro.Contains("datas passadas")
                    ? UnprocessableEntity(new { message = erro })
                    : BadRequest(new { message = erro });

            // 3. Validação de Cliente
            var cliente = await _clienteRepository.BuscarPorIdAsync(request.ClienteId);
            if (cliente == null)
                return NotFound(new { message = "Cliente não encontrado" });

            // ✅ Bloqueia agendamento com cliente inativo
            if (cliente.Status != "Ativo")
                return UnprocessableEntity(new
                {
                    message = "Não é possível agendar com um cliente inativo"
                });

            // 4. Validação de Funcionário
            var funcionario =
                await _funcionarioRepository.BuscarPorIdAsync(request.FuncionarioId);

            if (funcionario == null)
                return NotFound(new { message = "Funcionário não encontrado" });

            if (cliente.Cpf == funcionario.Cpf)
                return BadRequest(new
                {
                    message = "Cliente e funcionário não podem ser a mesma pessoa"
                });

            var horaInicio = TimeOnly.Parse(request.HoraInicio);

            // 5. Validação de Turno
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
                    return BadRequest(new
                    {
                        message = $"Funcionário só pode ser agendado no turno {funcionario.Turno}"
                    });
            }

            // 6. Busca e validação dos Serviços
            var servicos = new List<Servico>();
            foreach (var servicoId in request.ServicosIds)
            {
                var servico = await _servicoRepository.BuscarPorIdAsync(servicoId);
                if (servico == null)
                    return NotFound(new { message = $"Serviço {servicoId} não encontrado" });

                var funcionarioRealizaServico =
                    funcionario.Servicos.Any(s => s.Id == servicoId);

                if (!funcionarioRealizaServico)
                    return BadRequest(new
                    {
                        message = $"Funcionário não realiza o serviço {servico.Nome}"
                    });

                servicos.Add(servico);
            }

            var tempoTotal = servicos.Sum(s => s.Tempo);
            var valorTotal = servicos.Sum(s => s.Preco);
            var data = DateOnly.Parse(request.Data);
            var horaFim = horaInicio.AddMinutes(tempoTotal);

            // 7. Validação de Horas Mensais
            if (!funcionario.Pj && funcionario.HorasMensais.HasValue)
            {
                var minutosJaTrabalhados =
                    await _agendamentoRepository.TotalMinutosTrabalhadosNoMesAsync(
                        request.FuncionarioId, data.Year, data.Month);

                if (agendamentoExistente.FuncionarioId == request.FuncionarioId &&
                    agendamentoExistente.Data.Year == data.Year &&
                    agendamentoExistente.Data.Month == data.Month)
                {
                    var tempoAntigo = agendamentoExistente.Servicos.Sum(s => s.Tempo);
                    minutosJaTrabalhados -= tempoAntigo;
                }

                var limiteMinutos = funcionario.HorasMensais.Value * 60;
                if (minutosJaTrabalhados + tempoTotal > limiteMinutos)
                {
                    var horasRestantes = (limiteMinutos - minutosJaTrabalhados) / 60m;
                    return UnprocessableEntity(new
                    {
                        message =
                            $"Funcionário atingiu o limite de horas mensais. " +
                            $"Restam {horasRestantes:F1}h disponíveis neste mês."
                    });
                }
            }

            // 8. Conflito Funcionário
            var conflitoFuncionario = await _agendamentoRepository.ExisteConflitoAsync(
                request.FuncionarioId, data, horaInicio, horaFim);

            if (conflitoFuncionario &&
                (agendamentoExistente.HoraInicio != horaInicio ||
                 agendamentoExistente.FuncionarioId != request.FuncionarioId ||
                 agendamentoExistente.Data != data))
                return Conflict(new { message = "Horário indisponível para este funcionário" });

            // 9. Conflito Cliente
            var conflitoCliente = await _agendamentoRepository.ExisteConflitoClienteAsync(
                request.ClienteId, data, horaInicio, horaFim);

            if (conflitoCliente &&
                (agendamentoExistente.HoraInicio != horaInicio ||
                 agendamentoExistente.ClienteId != request.ClienteId ||
                 agendamentoExistente.Data != data))
                return Conflict(new { message = "Cliente já possui agendamento neste horário" });

            // 10. Atualiza as propriedades
            agendamentoExistente.ClienteId = request.ClienteId;
            agendamentoExistente.FuncionarioId = request.FuncionarioId;
            agendamentoExistente.Data = data;
            agendamentoExistente.HoraInicio = horaInicio;
            agendamentoExistente.HoraFim = horaFim;
            agendamentoExistente.Total = valorTotal;

            agendamentoExistente.Servicos.Clear();
            foreach (var servico in servicos)
            {
                agendamentoExistente.Servicos.Add(new AgendamentoServico
                {
                    ServicoId = servico.Id,
                    Preco = servico.Preco,
                    Tempo = servico.Tempo
                });
            }

            // 11. Salva as alterações
            await _agendamentoRepository.AtualizarAsync(agendamentoExistente);

            return Ok(new AgendamentoResponse
            {
                Id = agendamentoExistente.Id,
                ClienteId = agendamentoExistente.ClienteId,
                FuncionarioId = agendamentoExistente.FuncionarioId,
                Cliente = cliente.Nome,
                Funcionario = funcionario.Nome,
                Servicos = servicos.Select(s => s.Nome).ToList(),
                Data = agendamentoExistente.Data.ToString("yyyy-MM-dd"),
                HoraInicio = agendamentoExistente.HoraInicio.ToString("HH:mm"),
                HoraFim = agendamentoExistente.HoraFim.ToString("HH:mm"),
                Total = agendamentoExistente.Total
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = ex.Message,
                inner = ex.InnerException?.Message
            });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(int id)
    {
        try
        {
            var agendamento =
                await _agendamentoRepository.BuscarPorIdAsync(id);

            if (agendamento == null)
                return NotFound(new { message = "Agendamento não encontrado" });

            await _agendamentoRepository.RemoverAsync(agendamento);

            return Ok(new { message = "Agendamento removido com sucesso" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = ex.Message,
                inner = ex.InnerException?.Message
            });
        }
    }
}