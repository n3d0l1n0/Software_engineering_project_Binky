import { getAuthToken } from './authService.js';

const API_URL = 'http://localhost:5278/api/Preporuka';

export async function getSvePreporuke() {
    try {
        const token = getAuthToken();
        const response = await axios.get(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Greška pri dohvatanju svih preporuka:', error);
        throw error;
    }
}

export async function getVazecePreporukeZaPorodilju(idPorodilje) {
    try {
        const response = await axios.get(
            `http://localhost:5278/api/Preporuka/porodilja/${idPorodilje}`
        );

        return (response.data?.$values || []).map(p => ({
            tekst: p.tekst,
            datumIsteka: p.datumDo 
        }));

    } catch (error) {
        if (error.response?.status === 404) {
            console.log('Nema preporuka:', error.response.data);
            return [];
        }
        console.error(`Greška pri preuzimanju preporuka za porodilju ${idPorodilje}:`, error);
        throw new Error('Neuspešno preuzimanje važećih preporuka.');
    }
}

export async function createPreporuka(preporuka) {
    try {
        const token = getAuthToken();
        const response = await axios.post(API_URL, preporuka, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("--- Detalji greške pri kreiranju preporuke ---");
        if (error.response) {
            console.error("Status koda:", error.response.status); 
            console.error("Poruka od servera:", error.response.data); 
        } else if (error.request) {
            console.error("Zahtev poslat, nema odgovora:", error.request);
        } else {
            console.error("Greška u pripremi zahteva:", error.message);
        }
        throw error; 
    }
}

export async function updatePreporuka(id, preporuka) {
    try {
        const token = getAuthToken();
        await axios.put(`${API_URL}/${id}`, preporuka, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (error) {
        console.error(`Greška pri ažuriranju preporuke ${id}:`, error);
        throw error;
    }
}

export async function deletePreporuka(id) {
    try {
        const token = getAuthToken();
        await axios.delete(`${API_URL}/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (error) {
        console.error(`Greška pri brisanju preporuke ${id}:`, error);
        throw error;
    }
}

export async function getPreporukaById(id) {
    try {
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error(`Greška pri dohvatanju preporuke sa ID-jem ${id}:`, error);
        throw error;
    }
}

export async function getPreporukeZaLekara(lekarId) {
    if (!lekarId) {
        throw new Error('ID lekara je obavezan.');
    }
    try {
        const token = getAuthToken(); 
        const response = await axios.get(`${API_URL}/lekar/${lekarId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data; 
    } catch (error) {
        console.error(`Greška pri dohvatanju preporuka za lekara ${lekarId}:`, error);
        throw error;
    }
}
