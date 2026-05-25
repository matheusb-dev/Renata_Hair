using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RenataHair.Infrastructure.Persistence;
using RenataHair.Application.Validators;
using RenataHair.Application.DTOs;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FuncionariosController : ControllerBase
{
    private readonly AppDbContext _context;

    public FuncionariosController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] FuncionarioRequest request)
    {
        try
        {
            var erro = FuncionarioValidation.Validar(request);
            if (erro != null)
                return BadRequest(new { message = erro });

            var cpf = new string(request.Cpf.Where(char.IsDigit).ToArray());

            var erroCpf = CpfValidation.Validar(cpf);
            if (erroCpf != null)
                return BadRequest(new { message = erroCpf });

            var cpfExiste = await _context.Funcionarios.AnyAsync(f => f.Cpf == cpf);
            if (cpfExiste)
                return Conflict(new { message = "CPF já cadastrado" });

            var servicos = await _context.Servicos
                .Where(s => request.ServicosIds.Contains(s.Id))
                .ToListAsync();

            var funcionario = new RenataHair.Domain.Entities.Funcionario
            {
                Nome = request.Nome.Trim(),
                Cpf = cpf,
                Telefone = new string(request.Telefone.Where(char.IsDigit).ToArray()),
                Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
                Endereco = string.IsNullOrWhiteSpace(request.Endereco) ? null : request.Endereco.Trim(),
                Turno = request.Turno.Trim(),
                HorasMensais = request.HorasMensais,
                HorasDisponiveis = request.HorasMensais,
                Pj = request.Pj,
                Servicos = servicos,
                CriadoEm = DateTime.UtcNow
            };

            _context.Funcionarios.Add(funcionario);

            if (request.CadastrarComoCliente)
            {
                var clienteExiste = await _context.Clientes.AnyAsync(c => c.Cpf == cpf);
                if (!clienteExiste)
                {
                    var cliente = new RenataHair.Domain.Entities.Cliente
                    {
                        Nome = funcionario.Nome,
                        Cpf = funcionario.Cpf,
                        Telefone = funcionario.Telefone,
                        Email = funcionario.Email,
                        Plano = "Nenhum",
                        Status = "Ativo",
                        CriadoEm = DateTime.UtcNow
                    };
                    _context.Clientes.Add(cliente);
                }
            }

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(BuscarPorId), new { id = funcionario.Id }, new FuncionarioResponse
            {
                Id = funcionario.Id,
                Nome = funcionario.Nome,
                Cpf = funcionario.Cpf,
                Telefone = funcionario.Telefone,
                Email = funcionario.Email,
                Endereco = funcionario.Endereco,
                Turno = funcionario.Turno,
                HorasMensais = funcionario.HorasMensais,
                HorasDisponiveis = funcionario.HorasDisponiveis,
                Pj = funcionario.Pj,
                Servicos = funcionario.Servicos.Select(s => s.Nome).ToList(),
                CriadoEm = funcionario.CriadoEm
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("todos")]
    public async Task<IActionResult> ListarTodos()
    {
        try
        {
            var funcionarios = await _context.Funcionarios
                .Include(f => f.Servicos)
                .ToListAsync();

            var resultado = funcionarios.Select(f => new FuncionarioResponse
            {
                Id = f.Id,
                Nome = f.Nome,
                Cpf = f.Cpf,
                Telefone = f.Telefone,
                Email = f.Email,
                Endereco = f.Endereco,
                Turno = f.Turno,
                HorasMensais = f.HorasMensais,
                HorasDisponiveis = f.HorasDisponiveis,
                Pj = f.Pj,
                Servicos = f.Servicos.Select(s => s.Nome).ToList(),
                CriadoEm = f.CriadoEm
            }).ToList();

            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] string? nome,
        [FromQuery] string? cpf,
        [FromQuery] string? turno)
    {
        try
        {
            var query = _context.Funcionarios
                .Include(f => f.Servicos)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(nome))
                query = query.Where(f => f.Nome.ToLower().Contains(nome.ToLower()));

            if (!string.IsNullOrWhiteSpace(cpf))
            {
                var cpfFiltro = new string(cpf.Where(char.IsDigit).ToArray());
                query = query.Where(f => f.Cpf == cpfFiltro);
            }

            if (!string.IsNullOrWhiteSpace(turno))
                query = query.Where(f => f.Turno.ToLower() == turno.ToLower());

            var funcionarios = await query.ToListAsync();

            var resultado = funcionarios.Select(f => new FuncionarioResponse
            {
                Id = f.Id,
                Nome = f.Nome,
                Cpf = f.Cpf,
                Telefone = f.Telefone,
                Email = f.Email,
                Endereco = f.Endereco,
                Turno = f.Turno,
                HorasMensais = f.HorasMensais,
                HorasDisponiveis = f.HorasDisponiveis,
                Pj = f.Pj,
                Servicos = f.Servicos.Select(s => s.Nome).ToList(),
                CriadoEm = f.CriadoEm
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
            var funcionario = await _context.Funcionarios
                .Include(f => f.Servicos)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (funcionario == null)
                return NotFound(new { message = "Funcionário não encontrado" });

            return Ok(new FuncionarioResponse
            {
                Id = funcionario.Id,
                Nome = funcionario.Nome,
                Cpf = funcionario.Cpf,
                Telefone = funcionario.Telefone,
                Email = funcionario.Email,
                Endereco = funcionario.Endereco,
                Turno = funcionario.Turno,
                HorasMensais = funcionario.HorasMensais,
                HorasDisponiveis = funcionario.HorasDisponiveis,
                Pj = funcionario.Pj,
                Servicos = funcionario.Servicos.Select(s => s.Nome).ToList(),
                CriadoEm = funcionario.CriadoEm
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] FuncionarioRequest request)
    {
        try
        {
            var funcionario = await _context.Funcionarios
                .Include(f => f.Servicos)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (funcionario == null)
                return NotFound(new { message = "Funcionário não encontrado" });

            var erro = FuncionarioValidation.Validar(request);
            if (erro != null)
                return BadRequest(new { message = erro });

            var cpf = new string(request.Cpf.Where(char.IsDigit).ToArray());

            var erroCpf = CpfValidation.Validar(cpf);
            if (erroCpf != null)
                return BadRequest(new { message = erroCpf });

            var cpfExiste = await _context.Funcionarios.AnyAsync(f => f.Cpf == cpf && f.Id != id);
            if (cpfExiste)
                return Conflict(new { message = "CPF já cadastrado" });

            var servicos = await _context.Servicos
                .Where(s => request.ServicosIds.Contains(s.Id))
                .ToListAsync();

            funcionario.Nome = request.Nome.Trim();
            funcionario.Cpf = cpf;
            funcionario.Telefone = new string(request.Telefone.Where(char.IsDigit).ToArray());
            funcionario.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
            funcionario.Endereco = string.IsNullOrWhiteSpace(request.Endereco) ? null : request.Endereco.Trim();
            funcionario.Turno = request.Turno.Trim();
            funcionario.HorasMensais = request.HorasMensais;
            funcionario.Pj = request.Pj;
            funcionario.Servicos = servicos;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Funcionário atualizado com sucesso" });
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
            var funcionario = await _context.Funcionarios.FindAsync(id);
            if (funcionario == null)
                return NotFound(new { message = "Funcionário não encontrado" });

            _context.Funcionarios.Remove(funcionario);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Funcionário removido com sucesso" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, inner = ex.InnerException?.Message });
        }
    }
}