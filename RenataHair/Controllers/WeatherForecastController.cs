using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;

namespace RenataHair.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WeatherForecastController : ControllerBase
    {
        private static readonly string[] Summaries =
        {
            "Freezing", "Bracing", "Chilly", "Cool", "Mild",
            "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        };

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [HttpGet(Name = "GetWeatherForecast")]
        public IActionResult Get()
        {
            // Pega o claim "exp" (expiração do token)
            var expClaim = User.FindFirst(JwtRegisteredClaimNames.Exp)?.Value;

            DateTime? expiracao = null;
            double? minutosRestantes = null;

            if (expClaim != null)
            {
                var expSeconds = long.Parse(expClaim);
                expiracao = DateTimeOffset
                    .FromUnixTimeSeconds(expSeconds)
                    .UtcDateTime;

                minutosRestantes = (expiracao.Value - DateTime.UtcNow).TotalMinutes;
            }

            var data = Enumerable.Range(1, 5).Select(index => new WeatherForecast
            {
                Date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(index)),
                TemperatureC = Random.Shared.Next(-20, 55),
                Summary = Summaries[Random.Shared.Next(Summaries.Length)]
            }).ToArray();

            return Ok(new
            {
                autenticado = User.Identity?.IsAuthenticated,
                expiracao,
                minutosRestantes,
                dados = data
            });
        }
    }
}