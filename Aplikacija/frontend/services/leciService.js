const API_BASE = 'http://localhost:5278';

export async function poveziLekaraSaPorodiljom(idPorodilje, idLekara) {
    if (!idPorodilje || !idLekara) {
        throw new Error("Moraju biti prosleđeni ID porodilje i ID lekara.");
    }
    const lecenjeData = {
        IdPorodilje: idPorodilje,
        IdLekara: idLekara,
        Aktivno: true
    };

    try {
        const response = await axios.post(
            `${API_BASE}/leci/Leci/dodaj_leci`, 
            lecenjeData
        );

        console.log('Uspešno kreirano lečenje:', response.data);
        return response.data;
        
    } catch (error) {
        console.error("Greška pri povezivanju lekara i porodilje:", error);
        throw new Error(error.response?.data?.message || "Neuspešno povezivanje sa lekarom. Proverite putanju i format podataka.");
    }
}