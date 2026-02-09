import { getAuthToken } from './authService.js';

const API_BASE_URL = 'http://localhost:5278/api/Rezultat';

export async function createRezultat(rezultatData) {
    const token = getAuthToken();
    if (!token) throw new Error('Token za autorizaciju nije pronađen.');

    try {
        const response = await axios.post(`${API_BASE_URL}/dodaj_rezultat`, rezultatData, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        return response.data;
    } catch (error) {
        console.error('Greška pri kreiranju rezultata:', error.response || error);
        throw new Error('Nije uspelo kreiranje rezultata.');
    }
}

export async function getRezultatiZaPregled(pregledId) {
    const token = getAuthToken();
    if (!token) {
        console.error('Token za autorizaciju nije pronađen.');
        throw new Error('Token za autorizaciju nije pronađen.');
    }

    try {
        const response = await axios.get(`${API_BASE_URL}/rezultati_za_pregled/${pregledId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data?.$values || response.data || [];
    } catch (error) {
        if (error.response) {
            console.error(`Greška pri dohvatanju rezultata za pregled ${pregledId}:`, {
                status: error.response.status,
                data: error.response.data
            });
        } else if (error.request) {
            console.error('Nije primljen odgovor od servera:', error.request);
        } else {
            console.error('Greška prilikom slanja zahteva:', error.message);
        }
        throw new Error('Nije uspelo dohvatanje rezultata.');
    }
}