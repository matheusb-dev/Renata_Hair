using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddControllers();

// =========================
// SWAGGER COM JWT
// =========================
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Digite: Bearer {seu_token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// =========================
// JWT CONFIG
// =========================
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? "MinhaChaveSuperSecretaComPeloMenos32Chars";

var key = Encoding.ASCII.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),

        ValidateIssuer = false,
        ValidateAudience = false,

        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// =========================
// DB
// =========================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// =========================
// PIPELINE
// =========================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

// 🔥 IMPORTANTE: ORDEM CORRETA
app.UseAuthentication();
app.UseAuthorization();

// =========================    
// BLACKLIST (APÓS AUTH)
// =========================
app.Use(async (context, next) =>
{
    var authHeader = context.Request.Headers["Authorization"].ToString();

    if (!string.IsNullOrEmpty(authHeader) &&
        authHeader.StartsWith("Bearer "))
    {
        var token = authHeader.Replace("Bearer ", "");
        var db = context.RequestServices.GetRequiredService<AppDbContext>();

        var invalid = await db.TokensInvalidados.AnyAsync(x => x.Token == token);

        if (invalid)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new
            {
                message = "Token revogado. Faça login novamente."
            });
            return;
        }
    }

    await next();
});

app.MapControllers();

app.Run();