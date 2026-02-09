using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyBackend.Models
{
    [Table("porodilja")]
    public class Porodilja
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("imeiprezime")]
        public string ImeIPrezime { get; set; } = string.Empty;

        [Column("datumrodjenja")]
        public DateTime DatumRodjenja { get; set; }

        [Column("email")]
        public string Email { get; set; } = string.Empty;

        [Column("lozinka")]
        public string Lozinka { get; set; } = string.Empty;

        [Column("telefon")]
        public string Telefon { get; set; } = string.Empty;

        [Column("lbo")]
        public string LBO { get; set; } = string.Empty;

        [Column("pocetaktrudnoce")]
        public DateTime PocetakTrudnoce { get; set; }

        [Column("seporodila")]
        public bool SePorodila { get; set; }

        [Column("jmbg")]
        public string JMBG { get; set; } = string.Empty;

        [Column("profilnaslika")]
        public string? ProfilnaSlika { get; set; }

        public ICollection<Leci>? Leci { get; set; }
    }
}
