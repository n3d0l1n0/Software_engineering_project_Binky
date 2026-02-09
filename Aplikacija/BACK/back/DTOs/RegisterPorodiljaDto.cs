namespace MyBackend.DTOs
{
    public class RegisterPorodiljaDto
    {
        public string ImeIPrezime { get; set; } = string.Empty;
        public DateTime DatumRodjenja { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Lozinka { get; set; } = string.Empty;
        public string Telefon { get; set; } = string.Empty;
        public string JMBG { get; set; } = string.Empty;
        public string LBO { get; set; } = string.Empty;
        public DateTime PocetakTrudnoce { get; set; }
    }
}
