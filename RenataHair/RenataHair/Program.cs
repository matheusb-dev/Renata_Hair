using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger com filtro de senha
builder.Services.AddSwaggerGen(c =>
{
    c.OperationFilter<PasswordQueryFilter>();
});

// Cookie de Autorização
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/api/auth/login";
    });

// Banco
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

// Filtro para ocultar senha no Swagger
public class PasswordQueryFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        if (operation.Parameters == null) return;

        foreach (var parameter in operation.Parameters)
        {
         
            if (parameter.Name == null) continue;

            if (parameter.Name.ToLowerInvariant() == "password" && parameter.Schema != null)
            {
                
                if (parameter.Schema is OpenApiSchema schema)
                {
                    schema.Type = JsonSchemaType.String;
                    schema.Format = "password";
                }
            }
        }
    }
}