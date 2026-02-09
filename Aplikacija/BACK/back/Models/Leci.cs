using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyBackend.Models
{
    [Table("leci")]
    public class Leci
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("idporodilje")]
        public int IdPorodilje { get; set; }

        [Column("idlekara")]
        public int IdLekara { get; set; }

        [Column("aktivno")]
        public bool Aktivno { get; set; }

        [ForeignKey("IdPorodilje")]
        public Porodilja? Porodilja { get; set; }

        [ForeignKey("IdLekara")]
        public Lekar? Lekar { get; set; }

        public ICollection<Pregled>? Pregledi { get; set; }
        public ICollection<Preporuka>? Preporuke { get; set; }
    }
}