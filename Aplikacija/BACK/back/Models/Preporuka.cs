using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyBackend.Models
{
    [Table("preporuka")]
    public class Preporuka
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("idleci")]
        public int IdLeci { get; set; }

        [Column("tekst")]
        public string Tekst { get; set; } = string.Empty;

        [Column("datumod")]
        public DateTime DatumOd { get; set; }

        [Column("datumdo")]
        public DateTime DatumDo { get; set; }

        [ForeignKey("IdLeci")]
        public Leci? Leci { get; set; }

        //Navigacija
    }
}