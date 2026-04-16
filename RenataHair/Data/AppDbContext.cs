using Microsoft.EntityFrameworkCore;
using RenataHair.Models;

namespace RenataHair.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Usuarios> Usuarios { get; set; }
    }
}