export default class Porodilja {
    constructor(
        id,
        imeIPrezime,
        datumRodjenja,
        email,
        lozinka,
        telefon,
        lbo,
        pocetakTrudnoce,
        sePorodila,
        jmbg,
        profilnaSlika,
        leci = []
    ) {
        this.id = id;
        this.imeIPrezime = imeIPrezime;
        this.datumRodjenja = datumRodjenja;
        this.email = email;
        this.lozinka = lozinka;
        this.telefon = telefon;
        this.lbo = lbo;
        this.pocetakTrudnoce = pocetakTrudnoce;
        this.sePorodila = sePorodila;
        this.jmbg = jmbg;
        this.profilnaSlika = profilnaSlika;
        this.leci = leci;
    }
}
