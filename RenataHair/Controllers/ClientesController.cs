using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RenataHair.Infrastructure.Persistence;

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
    public async Task<IActionResult> Criar(
    [FromBody] ClienteRequest request)
    {
        try
        {
            var erroCampos =
                CamposValidation.Validar(request);

            if (erroCampos != null)
            {
                return BadRequest(new
                {
                    message = erroCampos
                });
            }

            var cpf = new string(
                request.Cpf
                    .Where(char.IsDigit)
                    .ToArray());

            var erroCpf = CpfValidation.Validar(cpf);

            if (erroCpf != null)
            {
                return BadRequest(new
                {
                    message = erroCpf
                });
            }

            var cpfExiste = await _context.Clientes
                .AnyAsync(c => c.Cpf == cpf);

            if (cpfExiste)
            {
                return Conflict(new
                {
                    message = "CPF já cadastrado"
                });
            }

            var erroPlano =
                PlanoValidation.Validar(request);

            if (erroPlano != null)
            {
                return erroPlano.Contains("mensalidade")
                    ? UnprocessableEntity(new
                    {
                        message = erroPlano
                    })
                    : BadRequest(new
                    {
                        message = erroPlano
                    });
            }

            var cliente =
                new RenataHair.Domain.Entities.Cliente
                {
                    Nome = request.Nome.Trim(),

                    Cpf = cpf,

                    Telefone = telefoneNumeros(
                        request.Telefone),

                    Email = string.IsNullOrWhiteSpace(
                        request.Email)
                        ? null
                        : request.Email.Trim(),

                    Plano = request.Plano.Trim(),

                    TipoMensalidade =
                        string.Equals(
                            request.Plano.Trim(),
                            "Premium",
                            StringComparison.OrdinalIgnoreCase)
                        ? request.TipoMensalidade?.Trim()
                        : null,

                    Endereco =
                        string.IsNullOrWhiteSpace(
                            request.Endereco)
                        ? null
                        : request.Endereco.Trim(),

                    Status = "Ativo",

                    CriadoEm = DateTime.UtcNow
                };

            _context.Clientes.Add(cliente);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(Criar),

                new { id = cliente.Id },

                new ClienteResponse
                {
                    Id = cliente.Id,
                    Nome = cliente.Nome,
                    Cpf = cliente.Cpf,
                    Telefone = cliente.Telefone,
                    Email = cliente.Email,
                    Plano = cliente.Plano,
                    TipoMensalidade =
                        cliente.TipoMensalidade,
                    Endereco = cliente.Endereco,
                    Status = cliente.Status,
                    CriadoEm = cliente.CriadoEm
                });
        }
        catch (Exception)
        {
            return StatusCode(500, new
            {
                message = "Erro ao processar cliente"
            });
        }
    }

    private static string telefoneNumeros(string telefone)
    {
        return new string(telefone.Where(char.IsDigit).ToArray());
    }
}