using Npgsql;
using RenataHair.Models;
namespace RenataHair.Models
{ 
public class Usuarios
{
    public int id { get; set; }
    public string usuario { get; set; } = string.Empty;
    public string senha { get; set; } = string.Empty;

        static void Main()
        {
            var connString = "Host=localhost;Port=5432;Database=RenataHair;Username=postgres;Password=123456";

            using var conn = new NpgsqlConnection(connString);
            conn.Open();

            Console.WriteLine("Conectado!");

            string sql = "INSERT INTO usuarios (nome, senha) VALUES (@nome, @senha)";
            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("nome", "admin");
            cmd.Parameters.AddWithValue("senha", "123");

            cmd.ExecuteNonQuery();

            Console.WriteLine("Dados inseridos com sucesso!");
        }
    }
}