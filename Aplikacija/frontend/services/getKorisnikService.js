import { getAuthToken, configureAxiosAuth, logout } from './authService.js';
const API_BASE = 'http://localhost:5278';

export async function fetchCurrentUser() {
    const token = getAuthToken();
    const userType = localStorage.getItem('userType');
    const userId = localStorage.getItem('userId');

    if (!token || !userType || !userId) {
        console.warn("Korisnik nije ulogovan ili nema token.");
        return null;
    }

    configureAxiosAuth(token);

    let endpoint = '';

  if (userType === 'porodilja') {
    endpoint = `/porodilja/Porodilja/porodilja/${userId}`;
  } else if (userType === 'lekar') {
    endpoint = `/lekar/Lekar/lekar/${userId}`;
  } else {
    console.error("Nepoznat tip korisnika:", userType);
    return null;
  }

  try {
    console.log(`${API_BASE}${endpoint}`);
    const response = await axios.get(`${API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return {
      data: response.data,
      userType,
      isLoggedIn: true
    };
    } catch (error) {
        console.error("Greška prilikom dohvatanja podataka o korisniku:", error);

        if (error.response?.status === 401 || error.response?.status === 403) {
            await logout();
        }

        return null;
    }
}
export async function fetchLekari() {
  try {
    const response = await axios.get(`${API_BASE}/lekar/Lekar/lekari`);
    
    return response.data; 

  } catch (error) {
    console.error('Greška pri preuzimanju lekara:', error);
    throw error;
  }
}
export async function fetchLekarZaPorodilju(idPorodilje){
  try {
    const response = await axios.get(`${API_BASE}/leci/Leci/leci_porodilju/${idPorodilje}`);
    
    return response.data; 

  } catch (error) {
    console.error('Greška pri preuzimanju lekara:', error);
    throw error;
  }

}
