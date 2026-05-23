using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RenataHair.Application.DTOs;
using RenataHair.Infrastructure.Persistence;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using RenataHair.Application.Validators;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly string _jwtSecret;

    public AuthController(
        AppDbContext context,
        IConfiguration configuration)
    {
        _context = context;

        _jwtSecret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException(
                "Jwt:Secret não configurado."
            );
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest login)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(login.Usuario))
            {
                return BadRequest(new
                {
                    message = "Usuário é obrigatório"
                });
            }

            if (string.IsNullOrWhiteSpace(login.Senha))
            {
                return BadRequest(new
                {
                    message = "Senha é obrigatória"
                });
            }

            var usuarioDB = await _context.Usuarios
                .FirstOrDefaultAsync(
                    u => u.Nome == login.Usuario.Trim()
                );

            if (usuarioDB == null)
            {
                return NotFound(new
                {
                    message = "Usuário não encontrado"
                });
            }

            if (!BCrypt.Net.BCrypt.Verify(
                login.Senha,
                usuarioDB.Senha))
            {
                return Unauthorized(new
                {
                    message = "Usuário ou senha inválidos"
                });
            }

            var tokenHandler = new JwtSecurityTokenHandler();

            var key = Encoding.ASCII.GetBytes(_jwtSecret);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("id", usuarioDB.Id.ToString()),
                    new Claim("usuario", usuarioDB.Nome)
                }),

                Expires = DateTime.UtcNow.AddMinutes(10),

                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature
                )
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);

            var tokenString = tokenHandler.WriteToken(token);

            return Ok(new
            {
                token = tokenString,

                usuario = new
                {
                    id = usuarioDB.Id,
                    usuario = usuarioDB.Nome
                }
            });
        }
        catch
        {
            return StatusCode(500, new
            {
                message = "Erro ao realizar login"
            });
        }
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var token = Request.Headers["Authorization"]
            .ToString()
            .Replace("Bearer ", "");

        if (string.IsNullOrEmpty(token))
        {
            return BadRequest(new
            {
                message = "Token não informado"
            });
        }

        _context.TokensInvalidados.Add(
            new RenataHair.Domain.Entities.TokenInvalidado
            {
                Token = token
            });

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Logout realizado com sucesso"
        });
    }

    [HttpGet("gerar-hash/{senha}")]
    public IActionResult GerarHash(string senha)
    {
        var hash = BCrypt.Net.BCrypt.HashPassword(senha);

        return Ok(new
        {
            hash
        });
    }

    [HttpPost("validar-token")]
    public IActionResult ValidarToken(
        [FromBody] ValidarTokenRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.Token))
        {
            return Unauthorized(new
            {
                valido = false,
                message = "Token não enviado"
            });
        }

        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();

            var key = Encoding.ASCII.GetBytes(_jwtSecret);

            tokenHandler.ValidateToken(
                request.Token,
                new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,

                    IssuerSigningKey =
                        new SymmetricSecurityKey(key),

                    ValidateIssuer = false,
                    ValidateAudience = false,

                    ClockSkew = TimeSpan.Zero
                },
                out SecurityToken validatedToken
            );

            var jwtToken =
                (JwtSecurityToken)validatedToken;

            var exp = jwtToken.ValidTo;

            var minutosRestantes =
                (exp - DateTime.UtcNow).TotalMinutes;

            var usuarioId = jwtToken.Claims
                .FirstOrDefault(x => x.Type == "id")
                ?.Value;

            var usuarioNome = jwtToken.Claims
                .FirstOrDefault(x => x.Type == "usuario")
                ?.Value;

            return Ok(new
            {
                valido = true,
                message = "Token válido",
                expiracao = exp,
                minutosRestantes,

                usuario = new
                {
                    id = usuarioId,
                    nome = usuarioNome
                }
            });
        }
        catch
        {
            return Unauthorized(new
            {
                valido = false,
                message = "Token inválido ou expirado"
            });
        }
    }
}