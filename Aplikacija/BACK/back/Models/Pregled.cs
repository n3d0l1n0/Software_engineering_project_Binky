using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyBackend.Models
{
    [Table("pregled")]
    public class Pregled
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("termin")]
        public DateTime Termin { get; set; }

        [Column("idleci")]
        public int IdLeci { get; set; }

        [Column("idtipapregleda")]
        public int IdTipaPregleda { get; set; }

        [Column("jepotvrdjen")]
        public bool JePotvrdjen { get; set; }

        [Column("dozvoljenoprikazivanje")]
        public bool DozvoljenoPrikazivanje { get; set; }

        [ForeignKey("IdLeci")]
        public Leci? Leci { get; set; }
        
        [ForeignKey("IdTipaPregleda")]
        public TipPregleda? TipPregleda { get; set; }
        public ICollection<Rezultat>? Rezultati { get; set; }
    }
}
