using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RenataHair.DTOs;
using RenataHair.Infrastructure.Persistence;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ServicosController : ControllerBase
{
    private readonly AppDbContext _context;

    public ServicosController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] ServicoRequest request)
    {
        try
        {
            var erro = ServicoValidation.Validar(request);

            if (erro != null)
                return BadRequest(new { message = erro });

            // 🔥 FORÇA o tipo correto (evita conflito de Servico duplicado)
            var servico = new RenataHair.Domain.Entities.Servico
            {
                Nome = request.Nome.Trim(),
                Tempo = request.Tempo,
                Preco = request.Preco,
                CriadoEm = DateTime.UtcNow
            };

            _context.Servicos.Add(servico);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(BuscarPorId),
                new { id = servico.Id },
                new ServicoResponse
                {
                    Id = servico.Id,
                    Nome = servico.Nome,
                    Tempo = servico.Tempo,
                    Preco = servico.Preco,
                    CriadoEm = servico.CriadoEm
                }
            );
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro ao processar serviço" });
        }
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        try
        {
            var servicos = await _context.Servicos
                .OrderBy(s => s.Nome)
                .Select(s => new ServicoResponse
                {
                    Id = s.Id,
                    Nome = s.Nome,
                    Tempo = s.Tempo,
                    Preco = s.Preco,
                    CriadoEm = s.CriadoEm
                })
                .ToListAsync();

            return Ok(servicos);
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro ao listar serviços" });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> BuscarPorId(int id)
    {
        try
        {
            var servico = await _context.Servicos.FindAsync(id);

            if (servico == null)
                return NotFound(new { message = "Serviço não encontrado" });

            return Ok(new ServicoResponse
            {
                Id = servico.Id,
                Nome = servico.Nome,
                Tempo = servico.Tempo,
                Preco = servico.Preco,
                CriadoEm = servico.CriadoEm
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro ao buscar serviço" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] ServicoRequest request)
    {
        try
        {
            var servico = await _context.Servicos.FindAsync(id);

            if (servico == null)
                return NotFound(new { message = "Serviço não encontrado" });

            var erro = ServicoValidation.Validar(request);

            if (erro != null)
                return BadRequest(new { message = erro });

            servico.Nome = request.Nome.Trim();
            servico.Tempo = request.Tempo;
            servico.Preco = request.Preco;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Serviço atualizado com sucesso" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro ao atualizar serviço" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(int id)
    {
        try
        {
            var servico = await _context.Servicos.FindAsync(id);

            if (servico == null)
                return NotFound(new { message = "Serviço não encontrado" });

            _context.Servicos.Remove(servico);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Serviço removido com sucesso" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro ao remover serviço" });
        }
    }
}