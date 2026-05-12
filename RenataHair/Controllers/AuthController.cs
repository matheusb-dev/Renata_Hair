using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using RenataHair.DTOs;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly string _jwtSecret;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _jwtSecret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret não configurado.");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest login)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(login.Usuario))
                return BadRequest(new { message = "Usuário é obrigatório" });

            if (string.IsNullOrWhiteSpace(login.Senha))
                return BadRequest(new { message = "Senha é obrigatória" });

            // ✅ Comparação exata — "Admin" != "admin"
            var usuarioDB = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Nome == login.Usuario.Trim());

            if (usuarioDB == null)
                return NotFound(new { message = "Usuário não encontrado" });

            if (!BCrypt.Net.BCrypt.Verify(login.Senha, usuarioDB.Senha))
                return Unauthorized(new { message = "Usuário ou senha inválidos" });

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
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro ao realizar login" });
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
            return BadRequest(new { message = "Token não informado" });

        _context.TokensInvalidados.Add(new TokenInvalidado { Token = token });
        await _context.SaveChangesAsync();

        return Ok(new { message = "Logout realizado com sucesso" });
    }

    // Server para gerar o hash das senhas
    [HttpGet("gerar-hash/{senha}")]
    public IActionResult GerarHash(string senha)
    {
        var hash = BCrypt.Net.BCrypt.HashPassword(senha);
        return Ok(new { hash });
    }
}