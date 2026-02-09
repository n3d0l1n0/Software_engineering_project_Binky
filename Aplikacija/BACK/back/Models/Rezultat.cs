using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyBackend.Models
{
    [Table("rezultat")]
    public class Rezultat
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("datum")]
        public DateTime Datum { get; set; }

        [Column("tip")]
        public string Tip { get; set; } = "Krvna slika";

        [Column("sadrzaj")]
        public string Sadrzaj { get; set; } = string.Empty;

        [Column("idpregleda")]
        public int IdPregleda { get; set; }

        [ForeignKey("IdPregleda")]
        public Pregled? Pregled { get; set; }
    }
}