using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyBackend.Models
{
    [Table("tippregleda")]
    public class TipPregleda
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("naziv")]
        public string Naziv { get; set; } = string.Empty;

        [Column("vremetrajanja")]
        public int VremeTrajanja { get; set; }
    }
}
