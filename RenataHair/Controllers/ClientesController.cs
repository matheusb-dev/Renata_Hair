using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClientesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ClientesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] ClienteRequest request)
    {
        try
        {
            var erroCampos = CamposValidation.Validar(request);
            if (erroCampos != null)
                return BadRequest(new { message = erroCampos });

            var cpf = new string(request.Cpf.Where(char.IsDigit).ToArray());

            var erroCpf = CpfValidation.Validar(cpf);
            if (erroCpf != null)
                return BadRequest(new { message = erroCpf });

            var cpfExiste = await _context.Clientes.AnyAsync(c => c.Cpf == cpf);
            if (cpfExiste)
                return Conflict(new { message = "CPF já cadastrado" });

            var erroPlano = PlanoValidation.Validar(request);
            if (erroPlano != null)
                return erroPlano.Contains("mensalidade")
                    ? UnprocessableEntity(new { message = erroPlano })
                    : BadRequest(new { message = erroPlano });

            var cliente = new Cliente
            {
                Nome = request.Nome.Trim(),
                Cpf = cpf,
                Telefone = telefoneNumeros(request.Telefone),
                Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
                Plano = request.Plano.Trim(),
                TipoMensalidade = string.Equals(request.Plano.Trim(), "Premium", StringComparison.OrdinalIgnoreCase)
                    ? request.TipoMensalidade?.Trim()
                    : null,
                Endereco = string.IsNullOrWhiteSpace(request.Endereco) ? null : request.Endereco.Trim(),
                Status = "Ativo",
                CriadoEm = DateTime.UtcNow
            };

            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Criar), new { id = cliente.Id }, new ClienteResponse
            {
                Id = cliente.Id,
                Nome = cliente.Nome,
                Cpf = cliente.Cpf,
                Telefone = cliente.Telefone,
                Email = cliente.Email,
                Plano = cliente.Plano,
                TipoMensalidade = cliente.TipoMensalidade,
                Endereco = cliente.Endereco,
                Status = cliente.Status,
                CriadoEm = cliente.CriadoEm
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro ao processar cliente" });
        }
    }

    [HttpGet("todos")]
    public async Task<IActionResult> ListarTodos()
    {
        try
        {
            var clientes = await _context.Clientes
                .Select(c => new ClienteResponse
                {
                    Id = c.Id,
                    Nome = c.Nome,
                    Cpf = c.Cpf,
                    Telefone = c.Telefone,
                    Email = c.Email,
                    Plano = c.Plano,
                    TipoMensalidade = c.TipoMensalidade,
                    Endereco = c.Endereco,
                    Status = c.Status,
                    CriadoEm = c.CriadoEm
                }).ToListAsync();

            return Ok(clientes);
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro ao processar cliente" });
        }
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? nome, [FromQuery] string? cpf)
    {
        try
        {
            var query = _context.Clientes.AsQueryable();

            if (!string.IsNullOrWhiteSpace(nome))
                query = query.Where(c => c.Nome.ToLower().Contains(nome.ToLower()));

            if (!string.IsNullOrWhiteSpace(cpf))
            {
                var cpfFiltro = new string(cpf.Where(char.IsDigit).ToArray());
                query = query.Where(c => c.Cpf == cpfFiltro);
            }

            var clientes = await query.Select(c => new ClienteResponse
            {
                Id = c.Id,
                Nome = c.Nome,
                Cpf = c.Cpf,
                Telefone = c.Telefone,
                Email = c.Email,
                Plano = c.Plano,
                TipoMensalidade = c.TipoMensalidade,
                Endereco = c.Endereco,
                Status = c.Status,
                CriadoEm = c.CriadoEm
            }).ToListAsync();

            return Ok(clientes);
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro ao processar cliente" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] ClienteRequest request)
    {
        try
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null)
                return NotFound(new { message = "Cliente não encontrado" });

            var erroCampos = CamposValidation.Validar(request);
            if (erroCampos != null)
                return BadRequest(new { message = erroCampos });

            var cpf = new string(request.Cpf.Where(char.IsDigit).ToArray());

            var erroCpf = CpfValidation.Validar(cpf);
            if (erroCpf != null)
                return BadRequest(new { message = erroCpf });

            var cpfExiste = await _context.Clientes.AnyAsync(c => c.Cpf == cpf && c.Id != id);
            if (cpfExiste)
                return Conflict(new { message = "CPF já cadastrado" });

            var erroPlano = PlanoValidation.Validar(request);
            if (erroPlano != null)
                return erroPlano.Contains("mensalidade")
                    ? UnprocessableEntity(new { message = erroPlano })
                    : BadRequest(new { message = erroPlano });

            cliente.Nome = request.Nome.Trim();
            cliente.Cpf = cpf;
            cliente.Telefone = telefoneNumeros(request.Telefone);
            cliente.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
            cliente.Plano = request.Plano.Trim();
            cliente.TipoMensalidade = string.Equals(request.Plano.Trim(), "Premium", StringComparison.OrdinalIgnoreCase)
                ? request.TipoMensalidade?.Trim()
                : null;
            cliente.Endereco = string.IsNullOrWhiteSpace(request.Endereco) ? null : request.Endereco.Trim();

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cliente atualizado com sucesso" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro ao processar cliente" });
        }
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> AlterarStatus(int id, [FromBody] AlterarStatusRequest request)
    {
        try
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null)
                return NotFound(new { message = "Cliente não encontrado" });

            var erroStatus = StatusValidation.Validar(request.Status);
            if (erroStatus != null)
                return BadRequest(new { message = erroStatus });

            cliente.Status = request.Status;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Status alterado para {request.Status}" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro ao processar cliente" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(int id)
    {
        try
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null)
                return NotFound(new { message = "Cliente não encontrado" });

            _context.Clientes.Remove(cliente);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cliente removido com sucesso" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro ao processar cliente" });
        }
    }

    private static string telefoneNumeros(string telefone)
    {
        return new string(telefone.Where(char.IsDigit).ToArray());
    }
}