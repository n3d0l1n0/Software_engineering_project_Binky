
const BASE_URL = 'http://localhost:5278/api/Auth';
const TOKEN_KEY = 'token';
const USER_ID_KEY = 'userId';
const USER_TYPE_KEY = 'userType';

function setAuthToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function removeAuthToken(){
    localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(){
    return localStorage.getItem(TOKEN_KEY); 
}

export function configureAxiosAuth(token) {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
}

export async function registerUser(userData) {
    console.log("Registracija korisnika:", userData);
    try {
        const response = await axios.post(`${BASE_URL}/register/porodilja`, userData,{
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return { success: true, data: response.data, error: null};
    } catch (error) {
        let errorMessage = error.response?.data?.message || "Došlo je do greške prilikom registracije.";
        
        errorMessage = "Došlo je do nepoznate mrežne greške.";

        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            if (typeof data === 'string' && status === 400) {
                errorMessage = data;
            } else if (data && data.message) {
                errorMessage = data.message;
            } else if (data && data.errors) {
                const firstKey = Object.keys(data.errors)[0];
                errorMessage = data.errors[firstKey][0] || "Podaci su nevalidni.";
            } else if (status === 400) {
                errorMessage = "Podaci su nevalidni. Proverite sva polja i format datuma.";
            }
            return { success: false, message: errorMessage };
        }
    }
}

export async function updateProfilePicture(userId, file) {
    try{
        const response = await axios.patch(`${BASE_URL}/porodilja/${userId}/profilna-slika`, {
            ProfilnaSlika: file
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
        return { success: true, data: response.data };
    } catch (error) {
        console.error("Greška prilikom ažuriranja profilne slike:", error);
        let errorMessage = error.response?.data?.message || "Došlo je do greške prilikom ažuriranja profilne slike.";
        return { success: false, message: errorMessage };
    }
}

export async function loginUser(email, lozinka, userType) {
    const endpoint = userType === 'porodilja' 
                     ? `${BASE_URL}/login/porodilja` 
                     : `${BASE_URL}/login/lekar`;
    console.log('Šaljem na server:', { Email: email, Lozinka: lozinka });

    try {
        const response = await axios.post(endpoint, { 
            Email: email, 
            Lozinka: lozinka 
        });

        const token = response.data.token;
        if(!token) {
            throw new Error("Server nije vratio token.");
        }
        setAuthToken(token);
        configureAxiosAuth(token);
        localStorage.setItem(USER_ID_KEY, response.data.userId);
        localStorage.setItem(USER_TYPE_KEY, userType);
    
        return {success:true, data: response.data, error: null };

    } catch (error) {
        console.error("Greška prilikom prijave:", error);
        const errorMessage = error.response?.data || "Pogrešan email ili lozinka.";
        return { success: false, data: null, error: errorMessage };
    }
}

export async function logout() {
    removeAuthToken();
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_TYPE_KEY);
    return { error: null };
}

export async function getCurrentUser() {
    const token = getAuthToken();
    const userType = localStorage.getItem(USER_TYPE_KEY);

    if(!token || !userType) {
        return null;
    }

    configureAxiosAuth(token);
    let endpoint = '';
    if(userType === 'porodilja') {
        endpoint = 'porodilja///'
    } else if(userType === 'lekar') {
        endpoint = 'lekar///'
    } else {
        logout();
        return null;
    }

    try{
        const response = await axios.get(`http://localhost:5278/api/${endpoint}`);
        return {
            ...response.data,
            userType: userType,
            isLoggenIn: true
        };
    } catch(error) {
        console.error("Greška prilikom dohvatanja podataka o korisniku:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
            logout();
            return null;
        }
        return null;
    }
}



export async function searchUserByJMBG(jmbg) {
    if(!jmbg || jmbg.length !== 13 ||  !/^\d+$/.test(jmbg)) {
        console.error("Greška: JMBG mora biti tačno 13 cifara.");
        alert("Molimo unesite ispravan 13-cifreni JMBG.");
        return null;
    }
    try{
        const response = await fetch(`http://localhost:5278/porodilja/Porodilja/jmbg/${jmbg}`);
        if(response.ok){
            const data = await response.json();
            return data;
        } 

        if (response.status === 404) {
            console.warn(`Pretraga: Porodilja sa JMBG ${jmbg} nije pronađena.`);
            return null; 
        }

        const errorText = await response.text();
        throw new Error(`API greška: ${response.status} ${response.statusText}. Poruka: ${errorText.substring(0, 100)}...`);
    } catch (error) {
        console.error("Došlo je do greške pri komunikaciji sa serverom:", error.message);
        alert(`Neuspešna pretraga: ${error.message}`);
        return null;
    }
}

