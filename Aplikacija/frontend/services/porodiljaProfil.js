import { clearElement, createTextElement } from '../utilis/functionUtilis.js';
import { fetchCurrentUser } from './getKorisnikService.js';
import { setupPasswordChangeDialog } from './lekarProfil.js';
import { VelicinaPloda } from '../models/velicinaPloda.js';


export async function renderPorodiljaProfilePage(content, porodilja) {
    clearElement(content);

    const porodiljaData = await fetchCurrentUser();

    if (!porodiljaData || !porodiljaData.data) {
        content.textContent = 'Greška pri učitavanju podataka porodilje.';
        return;
    }

    const porodiljaId = porodiljaData.data.id;

    const profileCard = document.createElement('div');
    profileCard.className = 'w-full bg-white shadow-xl p-6 flex flex-col justify-start border-t-4 border-pink-500 rounded-xl'; 

    const naslov = createTextElement('h1', 'PROFIL PORODILJE', 'text-4xl font-extrabold text-pink-500 mb-8 tracking-widest uppercase border-b-2 pb-2');
    profileCard.appendChild(naslov);

    const infoSection = document.createElement('div');
    infoSection.className = 'space-y-4 text-gray-700 text-left';

    const imeEl = createTextElement('p', porodiljaData.data.imeIPrezime, 'text-2xl font-bold text-pink-500 border-b pb-2 mb-4');
    infoSection.appendChild(imeEl);

    const emailEl = document.createElement('p');
    emailEl.innerHTML = `<span class="font-semibold text-pink-500">Email:</span> <span class="font-medium">${porodiljaData.data.email}</span>`;
    infoSection.appendChild(emailEl);

    const telefonEl = document.createElement('p');
    telefonEl.innerHTML = `<span class="font-semibold text-pink-500">Telefon:</span> <span class="font-medium">${porodiljaData.data.telefon}</span>`;
    infoSection.appendChild(telefonEl);

    const lbo = document.createElement('p');
    lbo.innerHTML = `<span class="font-semibold text-pink-500">LBO:</span> <span class="font-medium">${porodiljaData.data.lbo || 'N/A'}</span>`;
    infoSection.appendChild(lbo);

    const nedeljaTrudnoce = porodilja.pocetakTrudnoce ? Math.floor((new Date() - new Date(porodilja.pocetakTrudnoce)) / (1000*60*60*24*7)) + 1: 'Nepoznata';
    const velicinaPloda = document.createElement('p');
    velicinaPloda.innerHTML = `<span class="font-semibold text-pink-500">Beba je veličine:</span> ${
    porodilja.sePorodila ? 'Bebe' : VelicinaPloda[nedeljaTrudnoce]}`;
    infoSection.appendChild(velicinaPloda);


    const passwordBtn = document.createElement('button');
    passwordBtn.className = 'w-full mt-6 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-md';
    passwordBtn.textContent = 'Promena lozinke';
    
    passwordBtn.addEventListener('click', () => {
        setupPasswordChangeDialog(porodiljaId); 
    });
    infoSection.appendChild(passwordBtn);

    profileCard.appendChild(infoSection);
    content.appendChild(profileCard);

    return profileCard;
}
