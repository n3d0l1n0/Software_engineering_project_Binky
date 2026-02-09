import { getAuthToken } from './authService.js';
import { formatUTCToCET, formatLocalToUTC, formatTimeToCET } from '../utilis/dateUtilis.js';

const BASE_URL = 'http://localhost:5278/'; 

const fetchSlobodniTermini = async (porodiljaId, datum, tipPregledaId) => {
    if (!datum || !tipPregledaId) {
        throw new Error("Svi parametri (ID porodilje, datum, ID tipa pregleda) su obavezni za preuzimanje termina.");
    }
    const url = `http://localhost:5278/pregled/Pregled/slobodni_termini_za_porodilje/${porodiljaId}/${datum}/${tipPregledaId}`;
    
    try {
        const response = await axios.get(url);
        const termini = response.data && response.data.$values 
            ? response.data.$values 
            : response.data; 

        if (!Array.isArray(termini)) {
             throw new Error("Neočekivan format termina sa servera.");
        }

        return termini.map(utcString => ({
            originalUtc: utcString,
            displayCet: formatTimeToCET(utcString) 
        }));
        
    } catch (error) {
        const errorMessage = error.response && error.response.data 
            ? (typeof error.response.data === 'string' ? error.response.data : 'Došlo je do greške na serveru.')
            : error.message;

        throw new Error(`Greška pri dohvatanju termina: ${errorMessage}`);
    }
};
const zakaziTermin = async (idPorodilje, idTipaPregleda, termin) => {
    const response = await axios.post('http://localhost:5278/pregled/Pregled/zakazi', {
        IdPorodilje: idPorodilje,
        IdTipaPregleda: idTipaPregleda,
        Termin: formatLocalToUTC(termin)
    });
    return response.data;
};

const fetchBuduciPregledi = async (idPorodilje) => {
  try {
    const { data } = await axios.get(`http://localhost:5278/pregled/Pregled/buduci/${idPorodilje}`);

    const preglediArray = data.$values || data;

    return preglediArray.map(p => ({
      id: p.pregledId,
      termin: formatUTCToCET(p.termin),
      tip: p.tipPregleda,
      trajanje: p.trajanje,
      lekar: p.lekar,
      originalTermin: p.termin
    }));

  } catch (error) {
    console.error('Greška pri preuzimanju budućih pregleda preglediService:', error);
    throw error;
  }
};

const fetchNepotvrdjeniZahtevi = async (idPorodilje) => {
    try {
        const response = await axios.get(`${BASE_URL}pregled/Pregled/zahtevi_nepotvrdjeni/${idPorodilje}`);
        const zahtevi = response.data.$values || response.data;

        return zahtevi.map(req => ({
            ...req, 
            termin: formatUTCToCET(req.termin), 
            originalTermin: req.termin       
        }));
    } catch (error) {
        console.error('Greška pri dohvatanju nepotvrđenih zahteva:', error);
        throw error; 
    }
};
const fetchTipoviPregleda = async () => {
    const url = `${BASE_URL}api/TipPregleda`;
    
    try {
        const response = await axios.get(url);
        const tipovi = Array.isArray(response.data.$values) ? response.data.$values : [];
        return tipovi;

    } catch (error) {
        const errorMessage = error.response && error.response.data ? error.response.data : error.message;
        throw new Error(`Greška pri dohvatanju tipova pregleda: ${errorMessage}`);
    }
};


//LOGIKA ZA LEKARA 
export async function getZahteviZaPregled(idLekara) {
    const token = getAuthToken();
    if (!token) throw new Error("Token za autorizaciju nije pronađen.");

    try {
        const response = await axios.get(`http://localhost:5278/pregled/Pregled/zahtevi/${idLekara}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const zahtevi = response.data.$values || response.data;
        return zahtevi.map(z => ({
            ...z,
            termin: formatUTCToCET(z.termin)
        }));    
    } catch (error) {
        console.error("Greška pri dohvatanju zahteva za pregled:", error);
        throw error;
    }
}

export async function prihvatiPregled(idPregleda) {
    const token = getAuthToken();
    if (!token) throw new Error("Token za autorizaciju nije pronađen.");
    try {
        const response = await axios.put(`http://localhost:5278/pregled/Pregled/prihvati/${idPregleda}`, {}, { 
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Greška pri prihvatanju pregleda:", error);
        throw error;
    }
}

export async function odbijPregled(idPregleda) {
    const token = getAuthToken();
    if (!token) throw new Error("Token za autorizaciju nije pronađen.");
    try {
        const response = await axios.delete(`http://localhost:5278/pregled/Pregled/odbij/${idPregleda}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Greška pri odbijanju pregleda:", error);
        throw error;
    }
}

export async function getRasporedZaDan(idLekara, datum) {
    const token = getAuthToken();
    if (!token) throw new Error("Token za autorizaciju nije pronađen.");
    
    try {
        const response = await axios.get(`http://localhost:5278/pregled/Pregled/raspored`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: {
                idLekara: idLekara,
                datum: datum
            }
        });
        const raspored = response.data.$values || response.data;
        return raspored.map(r => ({
            ...r,
            terminVreme: formatTimeToCET(r.termin) 
        }));    } catch (error) {
        console.error("Greška pri dohvatanju rasporeda:", error);
        throw error;
    }
}
export async function getSviBuduciPregledi(idLekara) {
    try {
        const response = await axios.get(`http://localhost:5278/pregled/Pregled/buduci/${idLekara}`);
        return response.data;
    } catch (error) {
        console.error("Greška pri dohvatanju svih budućih pregleda:", error);
        throw error;
    }
}
export async function getProsliPregledi(porodiljaId) {
    try {
        const response = await axios.get(`http://localhost:5278/pregled/Pregled/prosli/${porodiljaId}`);
        console.log(response.data.$values);
        return response.data.$values; 

    } catch (error) {
        console.error('Greška pri fetch pregleda:', error.message);
        return null;
    }
}

export async function getDatumiSvihPregleda(lekarId) {
    try {
        const response = await axios.get(`http://localhost:5278/pregled/Pregled/datumi-pregleda/${lekarId}`);
        return response.data;

    } catch (error) {
        console.error('Došlo je do greške pri preuzimanju datuma pregleda:', error);
        throw new Error('Neuspešno preuzimanje datuma pregleda.');
    }
}
export async function getRezultatiZaPorodilju(idPorodilje) {
  const endpoint = `http://localhost:5278/api/Rezultat/rezultatui_porodilja/${idPorodilje}`;

  try {
    const response = await axios.get(endpoint);
    if (response.data && response.data.$values) {
        return response.data.$values;
    }
    return response.data;

  } catch (error) {
    console.error(`Greška pri preuzimanju rezultata za porodilju ${idPorodilje}:`, error.message);
    throw error;
  }
}

export { 
    fetchTipoviPregleda, 
    fetchSlobodniTermini, 
    zakaziTermin,
    fetchBuduciPregledi,
    fetchNepotvrdjeniZahtevi
};