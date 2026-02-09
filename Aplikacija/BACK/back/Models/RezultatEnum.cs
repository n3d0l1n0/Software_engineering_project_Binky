using NpgsqlTypes;

namespace MyBackend.Models
{
    public enum RezultatEnum
    {
        [PgName("Krvna slika")]
        KrvnaSlika,

        [PgName("Biohemija")]
        Biohemija,

        [PgName("Ultrazvuk")]
        Ultrazvuk,

        [PgName("Urinokultura")]
        Urinokultura,

        [PgName("Nalaz sa infektologije")]
        NalazSaInfektologije,

        [PgName("Prenatalni test")]
        PrenatalniTest
    }
}