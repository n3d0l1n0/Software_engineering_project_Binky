export class Lekar
{
    constructor(id, imeiprezime, datumrodjenja, email, lozinka, telefon, profilnaslika, ustanova, prostorija, leci = []) 
    {
        this.id = id;
        this.imeiprezime = imeiprezime;
        this.datumrodjenja = datumrodjenja;
        this.email = email;
        this.lozinka = lozinka;
        this.telefon = telefon;
        this.profilnaslika = profilnaslika;
        this.ustanova = ustanova;
        this.prostorija = prostorija;
        this.leci = leci; 
    }
}