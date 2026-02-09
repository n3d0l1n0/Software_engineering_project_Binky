import { clearElement, createTextElement } from '../utilis/functionUtilis.js';
import { formatDatum } from "../screens/dashboardPosetilac.js";
import { fetchCurrentUser } from './getKorisnikService.js';


export async function renderLekarProfilePage(content) {
    clearElement(content);

    const lekarData = await fetchCurrentUser();
    
    if (!lekarData || !lekarData.data) {
        content.textContent = 'Greška pri učitavanju podataka lekara.';
        return;
    }

    const lekarId = lekarData.data.id;
    
    const profileCard = document.createElement('div');
    profileCard.className = 'w-full bg-white shadow-xl p-6 flex flex-col justify-start border-t-4 border-pink-500 rounded-xl'; 

    const naslov = createTextElement('h1', 'PROFIL LEKARA', 'text-4xl font-extrabold text-pink-500 mb-8 tracking-widest uppercase border-b-2 pb-2');
    profileCard.appendChild(naslov);

    const infoSection = document.createElement('div');
    infoSection.className = 'space-y-4 text-gray-700 text-left';
    
    const imeEl = createTextElement('p', lekarData.data.imeIPrezime, 'text-2xl font-bold text-pink-500 border-b pb-2 mb-4');
    infoSection.appendChild(imeEl);
    
    const datumEl = document.createElement('p');
    datumEl.innerHTML = `<span class="font-semibold text-pink-500">Datum rođenja:</span> <span class="font-medium">${formatDatum(lekarData.data.datumRodjenja)}</span>`;
    infoSection.appendChild(datumEl);
    
    const emailEl = document.createElement('p');
    emailEl.innerHTML = `<span class="font-semibold text-pink-500">Email:</span> <span class="font-medium">${lekarData.data.email}</span>`;
    infoSection.appendChild(emailEl);

    const telefonEl = document.createElement('p');
    telefonEl.innerHTML = `<span class="font-semibold text-pink-500">Telefon:</span> <span class="font-medium">${lekarData.data.telefon}</span>`;
    infoSection.appendChild(telefonEl);
    
    const ustanovaEl = document.createElement('p');
    ustanovaEl.innerHTML = `<span class="font-semibold text-pink-500">Ustanova:</span> <span class="font-medium">${lekarData.data.ustanova}</span>`;
    infoSection.appendChild(ustanovaEl);

    const prostorijaEl = document.createElement('p');
    prostorijaEl.innerHTML = `<span class="font-semibold text-pink-500">Prostorija:</span> <span class="font-medium">${lekarData.data.prostorija}</span>`;
    infoSection.appendChild(prostorijaEl);

    const passwordBtn = document.createElement('button');
    passwordBtn.className = 'w-full mt-6 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-md';
    passwordBtn.textContent = 'Promena lozinke';
    
    passwordBtn.addEventListener('click', () => {
        setupPasswordChangeDialog(lekarId); 
    });
    infoSection.appendChild(passwordBtn);
    
    profileCard.appendChild(infoSection);

    content.appendChild(profileCard);

    return profileCard; 
}


export async function updatePassword(lekarId, trenutnaLozinka, novaLozinka) {
    const API_BASE_URL = 'http://localhost:5278';
    let url;
    if(localStorage.getItem(`userType`)===`lekar`) url = `${API_BASE_URL}/lekar/Lekar/promeni_lozinku/${lekarId}`
    else if(localStorage.getItem(`userType`)===`porodilja`) url = `${API_BASE_URL}/porodilja/Porodilja/promeni_lozinku/${lekarId}`
    else {
        console.log("Nepoznat tip korisnika prilikom promene lozinke.");
        return { success: false, message: 'Nepoznat tip korisnika.' };
    }

    const requestBody = {
        trenutnaLozinka: trenutnaLozinka,
        novaLozinka: novaLozinka
    };

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` 
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            return { success: true, message: 'Lozinka je uspešno promenjena!' };
        } 
        
        if (response.status === 400) {
            const errorData = await response.json();
            
            return { success: false, message: errorData.message || 'Neispravna trenutna lozinka.' };
        }

        if (response.status === 404) {
            return { success: false, message: 'Lekar nije pronađen (404).' };
        }

        return { success: false, message: `Greška servera: Status ${response.status}.` };

    } catch (error) {
        console.error('Došlo je do mrežne greške:', error);
        return { success: false, message: 'Nije moguće povezati se sa serverom.' };
    }
}

export function setupPasswordChangeDialog(lekarId) {
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300';

    const dialog = document.createElement('div');
    dialog.className = 'bg-white p-8 rounded-lg shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100';

    const title = createTextElement('h3', 'Promena lozinke', 'text-2xl font-bold mb-6 text-pink-600 border-b pb-2');
    dialog.appendChild(title);

    const form = document.createElement('form');
    form.className = 'space-y-4';

    form.appendChild(createInputField('Stara lozinka', 'oldPassword', 'password'));
    form.appendChild(createInputField('Nova lozinka', 'newPassword', 'password'));
    form.appendChild(createInputField('Potvrdi novu lozinku', 'confirmPassword', 'password'));

    const errorAlert = createTextElement('p', '', 'text-red-600 font-semibold hidden');
    form.appendChild(errorAlert);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Sačuvaj novu lozinku';
    submitBtn.className = 'w-full mt-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-md';
    form.appendChild(submitBtn);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = 'Zatvori';
    closeBtn.className = 'w-full mt-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-200';
    closeBtn.addEventListener('click', () => modal.remove());
    form.appendChild(closeBtn);
    
    const handlePasswordUpdate = async (oldPassword, newPassword) => {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ažuriranje...'; 

        const result = await updatePassword(lekarId, oldPassword, newPassword);

        submitBtn.disabled = false;
        submitBtn.textContent = 'Sačuvaj novu lozinku';

        if (result.success) {
            alert(result.message);
            modal.remove(); 
        } else {
            errorAlert.textContent = result.message;
            errorAlert.classList.remove('hidden');
        }
    };
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errorAlert.classList.add('hidden');

        const oldPass = document.getElementById('oldPassword').value.trim();
        const newPass = document.getElementById('newPassword').value.trim();
        const confirmPass = document.getElementById('confirmPassword').value.trim();

        if (newPass === '' || oldPass === '') {
            errorAlert.textContent = "Sva polja su obavezna.";
            errorAlert.classList.remove('hidden');
            return;
        }

        if (newPass !== confirmPass) {
            errorAlert.textContent = "Nova lozinka i potvrda moraju biti iste!";
            errorAlert.classList.remove('hidden');
            return;
        }
        
        handlePasswordUpdate(oldPass, newPass);
    });

    dialog.appendChild(form);
    modal.appendChild(dialog);
    document.body.appendChild(modal);
}

export function createInputField(label, id, type = 'text') {
    const div = document.createElement('div');
    div.className = 'flex flex-col';

    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    labelEl.className = 'mb-1 font-medium text-gray-700';

    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.name = id;
    input.className = 'p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500';
    
    div.appendChild(labelEl);
    div.appendChild(input);
    return div;
}