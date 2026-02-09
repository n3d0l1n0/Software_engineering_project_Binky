import { createDashboardCard } from '../components/dashboardCard.js';
import { createNavItem } from '../components/navBar.js';
import { fetchTipoviPregleda} from '../services/preglediService.js';
import {fetchSlobodniTermini} from '../services/preglediService.js';
import {zakaziTermin} from '../services/preglediService.js';
import { fetchCurrentUser } from '../services/getKorisnikService.js';
import Porodilja from '../models/porodilja.js'
import {fetchLekari} from '../services/getKorisnikService.js'
import {poveziLekaraSaPorodiljom} from '../services/leciService.js'
import {fetchNepotvrdjeniZahtevi} from '../services/preglediService.js'
import { fetchBuduciPregledi } from '../services/preglediService.js';
import {izracunajNedeljuTrudnoce} from '../services/doctorPorodiljaService.js';
import {renderPorodiljaProfilePage} from '../services/porodiljaProfil.js'
import {loadPreporuke, loadPreviousAppointments,loadRezultati} from './loaders.js'
import {createLekarSelectionModal, createSchedulingModal} from './modals.js'
import {createAppointmentItem} from '../components/items.js'
import {getRezultatiZaPorodilju} from '../services/preglediService.js'

export const getSelectedLekar = (porodiljaId) => {
    if (!porodiljaId) return { id: null, imeIPrezime: 'Nije izabran' };
    return {
        id: localStorage.getItem(`selectedLekarId_${porodiljaId}`) || null,
        imeIPrezime: localStorage.getItem(`selectedLekarIme_${porodiljaId}`) || 'Nije izabran'
    };
};
export const updateSelectedLekar = (lekar, porodiljaId) => {
    if (!porodiljaId) return;

    localStorage.setItem(`selectedLekarId_${porodiljaId}`, lekar.id);
    localStorage.setItem(`selectedLekarIme_${porodiljaId}`, lekar.imeIPrezime);

    const lekarDisplay = document.getElementById('dashboard-lekar-name');
    const lekarBtn = document.getElementById('open-global-lekar-modal-btn');

    if (lekarDisplay) lekarDisplay.textContent = lekar.imeIPrezime;
    if (lekarBtn) lekarBtn.textContent = lekar.id ? 'Promeni lekara' : 'Izaberi lekara';
};
export const handleFetchLekari = async (lekariListElement, lekarSelectionModal, porodiljaId) => {
    lekariListElement.innerHTML = '<p class="text-gray-500 text-center py-4">Učitavanje lekara...</p>';
    
    let lekari;

    try {
        const response = await fetchLekari();
        lekari = response.$values || response; 
    } catch (error) {
        console.error("Greška pri dohvatanju lekara:", error);
        lekariListElement.innerHTML = '<p class="text-red-500 text-center py-4">Greška pri učitavanju liste lekara.</p>';
        return;
    }

    lekariListElement.textContent = ''; 

    const selectedLekar = getSelectedLekar(porodiljaId);

    if (Array.isArray(lekari) && lekari.length > 0) {
        lekari.sort((a, b) => a.imeIPrezime.localeCompare(b.imeIPrezime)); 

        lekari.forEach(lekar => {
            const lekarItem = document.createElement('button');
            const isSelected = selectedLekar.id == lekar.id;
            lekarItem.className = `w-full text-left p-3 border rounded-xl transition duration-150 flex justify-between items-center ${isSelected ? 'border-pink-500 bg-pink-50 shadow-md' : 'border-gray-200 hover:bg-pink-100'}`;
            lekarItem.innerHTML = `
                <div>
                    <p class="font-semibold text-gray-800">${lekar.imeIPrezime}</p>
                    <p class="text-sm text-gray-500">${lekar.ustanova || 'Nema ustanove'}</p>
                </div>
                ${isSelected ? '<i class="fas fa-check-circle text-pink-500 text-xl"></i>' : '<i class="fas fa-user-plus text-gray-400"></i>'}
            `;
            lekarItem.onclick = async () => {
                if (!porodiljaId) {
                    alert("id porodilje nije dostupan.");
                    return;
                }
                updateSelectedLekar(lekar, porodiljaId); 
                lekarSelectionModal.classList.add('hidden'); 
                try {
                    await poveziLekaraSaPorodiljom(porodiljaId, lekar.id);
                } catch (error) {
                    console.log(error);
                }
            };
            lekariListElement.appendChild(lekarItem);
        });
    } else {
        lekariListElement.innerHTML = '<p class="text-red-500 text-center py-4">Nema dostupnih lekara.</p>';
    }
};
export default async function porodilja() {
    
    const mainContainer = document.createElement('div');
    mainContainer.className = 'min-h-screen md:flex bg-gray-50';

    const mobileMenuButton = document.createElement('button');
    mobileMenuButton.className = 'md:hidden fixed top-4 left-4 bg-white p-2 rounded-md shadow-lg z-30'; 
    mobileMenuButton.innerHTML = `<i class="fas fa-bars text-pink-600 text-xl"></i>`;

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-10 hidden md:hidden';

    const dashboardSection = document.createElement('div');
    dashboardSection.id = 'section-dashboard';
    dashboardSection.className = 'content-section'; 

    const preporukeSection = document.createElement('div');
    preporukeSection.id = 'section-preporuke';
    preporukeSection.className = 'content-section hidden';
    preporukeSection.innerHTML = '<h2 class="text-3xl font-bold text-gray-800 mb-6">Preporuke</h2><p class="text-gray-500">';
    
    const preporukeList = document.createElement('div');
    preporukeList.id = 'preporuke-list'; 
    preporukeList.className = 'bg-white p-6 rounded-2xl shadow-lg space-y-4';
    preporukeList.innerHTML = '<p class="text-gray-500">Preporuke će se učitati ovde...</p>';
    preporukeSection.appendChild(preporukeList);

    const userProfileSection = document.createElement('div');
    userProfileSection.id = 'section-userprofile';
    userProfileSection.className = 'content-section hidden';

    const rezultatiSection = document.createElement('div');
    rezultatiSection.id = 'section-rezultati';
    rezultatiSection.className = 'content-section hidden';
    rezultatiSection.innerHTML = '<h2 class="text-3xl font-bold text-gray-800 mb-6">Rezultati</h2><p class="text-gray-500"></p>';
    
    const rezultatiList = document.createElement('div');
    rezultatiList.id = 'rezultati-list'; 
    rezultatiList.className = 'bg-white p-6 rounded-2xl shadow-lg space-y-4';
    rezultatiList.innerHTML = '<p class="text-gray-500">Rezultati će se učitati ovde...</p>';
    rezultatiSection.appendChild(rezultatiList);
    
    const previousAppointmentsSection = document.createElement('div');
    previousAppointmentsSection.id = 'section-previous-appointments';
    previousAppointmentsSection.className = 'content-section hidden';

    const previousAppointmentsList = document.createElement('div');
    previousAppointmentsList.id = 'previousAppointments-list'; 
    previousAppointmentsList.className = 'bg-white p-6 rounded-2xl shadow-lg space-y-4';
    previousAppointmentsList.innerHTML = '<p class="text-gray-500"></p>';
    previousAppointmentsSection.appendChild(previousAppointmentsList);
    
    const userProfile = document.createElement('div');
    userProfile.id = 'section-userprofile';
    userProfile.className = 'content-section hidden';

    const currentUser = await fetchCurrentUser();
    if (!currentUser) {
        alert("Korisnik nije ulogovan ili token nije validan.");
        return mainContainer;
    }
    const porodilja = new Porodilja();
    Object.assign(porodilja, currentUser.data);
    const selectedLekar = getSelectedLekar(porodilja.id);
    
    const sidebar = document.createElement('aside');
    sidebar.className = `
        w-64 bg-white shadow-xl p-6 flex flex-col justify-between border-r border-pink-100
        transform -translate-x-full md:translate-x-0
        transition-transform duration-300 ease-in-out
        fixed md:relative h-screen md:h-auto z-20
    `;    
    const navContent = document.createElement('div');
    const logo = document.createElement('h1');
    logo.className = 'text-3xl font-extrabold text-pink-500 mb-8 tracking-wider';
    logo.textContent = 'BINKY';
    navContent.appendChild(logo);
    
    const nav = document.createElement('nav');
    nav.className = 'space-y-3';
    const dashboardLink = createNavItem('fas fa-home', 'Početna strana', true);
    const preporukeLink = createNavItem('fas fa-preporuke', 'Preporuke');
    const previousLink = createNavItem('fas fa-history', 'Prethodni pregledi'); 
    const userProfileLink = createNavItem('fas fa-userprofile', 'Korisnički profil');
    const rezultatiLink = createNavItem('fas fa-file-alt', 'Rezultati');


    nav.appendChild(dashboardLink);
    nav.appendChild(preporukeLink);
    nav.appendChild(previousLink);
    nav.appendChild(userProfileLink);
    nav.appendChild(rezultatiLink);
    navContent.appendChild(nav);
    
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'w-full py-2 px-4 text-sm bg-gray-200 hover:bg-red-500 hover:text-white rounded-xl transition duration-200 font-semibold text-gray-700 logout-button';
    logoutBtn.classList.add('odjaviSeButton');
    const logoutIcon = document.createElement('i');
    logoutIcon.className = 'fas fa-sign-out-alt mr-2';
    logoutBtn.appendChild(logoutIcon);
    logoutBtn.appendChild(document.createTextNode('Odjavi se'));
    sidebar.appendChild(navContent);
    sidebar.appendChild(logoutBtn);
    
    function toggleMenu() {
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    }

    mobileMenuButton.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);

    const mainContent = document.createElement('main');
    mainContent.className = 'flex-1 p-8 overflow-y-auto'; 
    const header = document.createElement('header');
    header.className = 'flex flex-col md:flex-row justify-between items-center gap-4 mb-8';
        
    const welcomeContainer = document.createElement('div');
    welcomeContainer.className = 'w-full text-center md:text-left';
    const welcome = document.createElement('h2');
    welcome.className = 'text-3xl md:text-4xl font-bold text-gray-800';
    welcome.textContent = `Dobrodošli, ${porodilja.imeIPrezime}!`;
    const subtitle = document.createElement('p');
    subtitle.className = 'text-gray-500 mt-1';
    subtitle.textContent = 'Vaš trenutni pregled stanja trudnoće.';
    welcomeContainer.appendChild(welcome);
    welcomeContainer.appendChild(subtitle);
    
    const openModalBtn = document.createElement('button');
    openModalBtn.id = 'open-schedule-modal-btn';
    openModalBtn.className = 'w-full md:w-auto bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md flex items-center justify-center';
    const openModalIcon = document.createElement('i');
    openModalIcon.className = 'fas fa-plus mr-2';
    openModalBtn.appendChild(openModalIcon);
    openModalBtn.appendChild(document.createTextNode(' Zakaži novi pregled'));
    
    header.appendChild(welcomeContainer);
    header.appendChild(openModalBtn);

    const lekarControlPanel = document.createElement('div');
    lekarControlPanel.className = 'flex justify-between items-center bg-white p-6 rounded-2xl shadow-lg mb-8 border-l-4 border-blue-400';
    lekarControlPanel.innerHTML = `
        <div>
            <p class="text-sm font-medium text-gray-500">Moj izabrani lekar</p>
            <h4 id="dashboard-lekar-name" class="text-xl font-bold text-gray-800">${selectedLekar.imeIPrezime}</h4>
        </div>
        <button id="open-global-lekar-modal-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-md flex items-center text-sm">
            <i class="fas fa-user-edit mr-2"></i> 
            ${selectedLekar.id ? 'Promeni lekara' : 'Izaberi lekara'}
        </button>
    `;
    mainContent.appendChild(lekarControlPanel);

    const cardsGrid = document.createElement('div');
    cardsGrid.className = `
        grid 
        grid-cols-1 md:grid-cols-2 
        gap-6 
        mb-10
        w-full
    `; 
    cardsGrid.appendChild(createDashboardCard('Nedelja trudnoće',`${izracunajNedeljuTrudnoce(porodilja.pocetakTrudnoce)}`, 'fas fa-baby', { border: 'border-pink-400', text: 'text-pink-600', bg: 'bg-pink-100' }));
    cardsGrid.appendChild(createDashboardCard('Sledeći pregled', 'Učitavanje...', 'fas fa-calendar-day', { border: 'border-blue-400', text: 'text-blue-600', bg: 'bg-blue-100' }));
    mainContent.appendChild(cardsGrid);

    const appointmentsContainer = document.createElement('div');
    appointmentsContainer.className = 'grid grid-cols-1 lg:grid-cols-2 gap-8';

    const futureAppointmentsSection = document.createElement('div');
    const futureTitle = document.createElement('h3');
    futureTitle.className = 'text-2xl font-semibold text-gray-700 mb-4 border-b pb-2';
    futureTitle.textContent = 'Naredni pregledi';
    const futureList = document.createElement('div');
    futureList.id = 'future-appointments-list';
    futureList.className = 'bg-white p-6 rounded-2xl shadow-lg space-y-4';
    futureList.innerHTML = '<p class="text-gray-500">Učitavanje zakazanih pregleda...</p>';
    futureAppointmentsSection.appendChild(futureTitle);
    futureAppointmentsSection.appendChild(futureList);
    
    const pendingAppointmentsSection = document.createElement('div');
    const pendingTitle = document.createElement('h3');
    pendingTitle.className = 'text-2xl font-semibold text-gray-700 mb-4 border-b pb-2';
    pendingTitle.textContent = 'Zahtevi na čekanju';
    const pendingList = document.createElement('div');
    pendingList.id = 'pending-appointments-list';
    pendingList.className = 'bg-white p-6 rounded-2xl shadow-lg space-y-4';
    pendingList.innerHTML = '<p class="text-gray-500">Učitavanje zahteva...</p>';
    pendingAppointmentsSection.appendChild(pendingTitle);
    pendingAppointmentsSection.appendChild(pendingList);

    appointmentsContainer.appendChild(futureAppointmentsSection);
    appointmentsContainer.appendChild(pendingAppointmentsSection);

    dashboardSection.appendChild(header);
    dashboardSection.appendChild(lekarControlPanel);
    dashboardSection.appendChild(cardsGrid);
    dashboardSection.appendChild(appointmentsContainer);
    mainContent.appendChild(previousAppointmentsSection);

    const modal = createSchedulingModal();
    const lekarModal = createLekarSelectionModal(); 
    mainContainer.appendChild(modal);
    mainContainer.appendChild(lekarModal);


    const pregledTypeSelect = modal.querySelector('#pregled-type');
    const pregledDateInput = modal.querySelector('#pregled-date');
    const terminiContainer = modal.querySelector('#termini-container');
    const terminiGrid = modal.querySelector('#termini-grid');
    const terminiLoader = modal.querySelector('#termini-loader');
    const zakaziSubmitBtn = modal.querySelector('#zakazi-termin-btn');

    const openGlobalLekarModalBtn = lekarControlPanel.querySelector('#open-global-lekar-modal-btn');
    const lekariList = lekarModal.querySelector('#lekari-list'); 


    let selectedTermin = null;
    
    const updateNextAppointmentCard = (nextAppDate) => {
        const nextAppCardValueEl = cardsGrid.children[1].querySelector('.text-3xl'); 
        if (nextAppCardValueEl) {
            nextAppCardValueEl.textContent = nextAppDate || 'Nema zakazanih';
        }
    };

   const loadDashboardData = async () => {
         try {
        const futureAppointments = await fetchBuduciPregledi(porodilja.id);
        futureList.textContent = ''; 

        if (futureAppointments.length === 0) {
            futureList.innerHTML = '<p class="text-gray-500">Nemate zakazanih pregleda.</p>';
            updateNextAppointmentCard(null); 
        } else {
            futureAppointments.forEach(app => futureList.appendChild(createAppointmentItem(app)));
            const nextAppointmentDate = new Date(futureAppointments[0].originalTermin)
                .toLocaleDateString('sr-Latn-RS',{ day: '2-digit', month: 'long' });
            
            updateNextAppointmentCard(nextAppointmentDate);
        }
    } catch (error) {
        console.error("Greška pri dohvatanju budućih pregleda:", error);
        futureList.innerHTML = '<p class="text-red-500">Greška pri učitavanju budućih pregleda.</p>';
    }

        try {
            const pendingRequests = await fetchNepotvrdjeniZahtevi(porodilja.id);
            pendingList.textContent = ''; 
            if (pendingRequests.length === 0) {
                pendingList.innerHTML = '<p class="text-gray-500">Nemate zahteva na čekanju.</p>';
            } else {
                pendingRequests.forEach(req => pendingList.appendChild(createAppointmentItem(req, true)));
            }
        } catch (error) {
            console.error("Greška pri dohvatanju zahteva na čekanju:", error);
            pendingList.innerHTML = '<p class="text-red-500">Greška pri učitavanju zahteva.</p>';
        }
    };

    const handleFetchTipoviPregleda = async () => {
        try {
            const tipovi = await fetchTipoviPregleda(); 
            console.log("Tipovi pregleda:", tipovi);


            while (pregledTypeSelect.options.length > 1) {
                pregledTypeSelect.remove(1);
            }
            tipovi.forEach(tip => {
                const option = document.createElement('option');
                option.value = tip.id;
                option.textContent = tip.naziv;
                pregledTypeSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Greška pri dohvatanju tipova pregleda:", error);
        }
    };

const handleFetchSlobodniTermini = async () => {
    const tipPregledaId = pregledTypeSelect.value;
    const datum = pregledDateInput.value;

    if (!tipPregledaId || !datum) {
        terminiContainer.classList.add('hidden');
        return;
    }

    terminiGrid.textContent = '';
    terminiLoader.classList.remove('hidden');
    terminiContainer.classList.remove('hidden');
    zakaziSubmitBtn.disabled = true;
    selectedTermin = null;

    try {

        const slobodniTermini = await fetchSlobodniTermini(porodilja.id, datum, tipPregledaId);

        terminiLoader.classList.add('hidden');
        terminiGrid.textContent = ''; 

        if (slobodniTermini.length === 0) {
            terminiGrid.innerHTML = '<p class="col-span-4 text-gray-500 text-center">Nema slobodnih termina za ovaj dan.</p>';
            return;
        }

        slobodniTermini.forEach(termin => {
            const terminBtn = document.createElement('button');
            terminBtn.className = 'p-2 border rounded-lg hover:bg-pink-100 hover:border-pink-400 transition';
            
            terminBtn.textContent = termin.displayCet;

            terminBtn.onclick = () => {
                const currentSelected = terminiGrid.querySelector('.bg-pink-500');
                if (currentSelected) {
                    currentSelected.classList.remove('bg-pink-500', 'text-white');
                }
                terminBtn.classList.add('bg-pink-500', 'text-white');

                selectedTermin = termin.originalUtc;

                zakaziSubmitBtn.disabled = false;
            };

            terminiGrid.appendChild(terminBtn);
        });

    } catch (error) {
        terminiGrid.innerHTML = `<p class="col-span-4 text-red-500 text-center">Greška: ${error.message}</p>`;
    } finally {
        terminiLoader.classList.add('hidden');
    }
};

    zakaziSubmitBtn.onclick = async () => {
        if (!selectedTermin || !pregledTypeSelect.value) {
        alert('Molimo izaberite tip pregleda i termin.');
        return;
    }
    
    zakaziSubmitBtn.disabled = true;
    zakaziSubmitBtn.textContent = 'Zakazivanje...';
    
    const idTipaPregleda = parseInt(pregledTypeSelect.value);

    try {

        const response = await zakaziTermin(porodilja.id, idTipaPregleda, selectedTermin);

        alert('Zahtev za termin je uspešno poslat i čeka potvrdu lekara!');
        modal.classList.add('hidden');
        await loadDashboardData();

    } catch (error) {
        console.error(error);
        const message = error.response?.data || error.message;
        alert(`Neuspešno zakazivanje: ${message}`);
    } finally {
        zakaziSubmitBtn.disabled = false;
        zakaziSubmitBtn.textContent = 'Zakaži termin';
    }
}
    const sections = {
        'Početna strana': dashboardSection,
        'Prethodni pregledi': previousAppointmentsSection,
        'Preporuke': preporukeSection,
        'Korisnički profil': userProfileSection,
        'Rezultati' : rezultatiSection
    };
    const activateSection = async (sectionName) => {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });
        nav.querySelectorAll('a').forEach(link => {
            if (link) {
                link.classList.remove('bg-pink-100', 'font-semibold', 'text-pink-600', 'shadow-md');
                link.classList.add('text-gray-700', 'hover:bg-pink-50', 'hover:text-pink-500'); 
            }
        });

        const sectionToShow = sections[sectionName];
        if (sectionToShow) {
            sectionToShow.classList.remove('hidden');
        }
        const activeNavItem = Array.from(nav.querySelectorAll('a')).find(a => a.textContent.trim() === sectionName);
        if (activeNavItem) {
            activeNavItem.classList.remove('text-gray-700', 'hover:bg-pink-50', 'hover:text-pink-500'); 
            activeNavItem.classList.add('bg-pink-100', 'font-semibold', 'text-pink-600', 'shadow-md');
        }
        
        if (sectionName === 'Početna strana') {
            await loadDashboardData(); 
        } else if (sectionName === 'Prethodni pregledi') {
            await loadPreviousAppointments(porodilja.id,previousAppointmentsList);
        } else if (sectionName === 'Rezultati') {
            await loadRezultati(porodilja.id, rezultatiList);
        } else if (sectionName === 'Preporuke') {
            await loadPreporuke(porodilja.id, preporukeList); 
        } else if(sectionName === 'Korisnički profil'){
            await renderPorodiljaProfilePage(userProfileSection,porodilja);
        } 
        
    };

    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionName = e.currentTarget.textContent.trim();
            activateSection(sectionName);
            if (window.innerWidth < 768) { 
                toggleMenu();
            }
        });
    });
  
    mainContainer.appendChild(mobileMenuButton);
    mainContainer.appendChild(overlay);
    mainContainer.appendChild(sidebar);
    mainContainer.appendChild(mainContent);
    
    mainContent.appendChild(dashboardSection);
    mainContent.appendChild(previousAppointmentsSection);
    mainContent.appendChild(preporukeSection);
    mainContent.appendChild(rezultatiSection);
    mainContent.appendChild(userProfileSection);

    loadDashboardData();

    openGlobalLekarModalBtn.onclick = () => {
        lekarModal.classList.remove('hidden');
        
        handleFetchLekari(lekariList, lekarModal, porodilja.id); 
    };

    openModalBtn.onclick = () => {
        modal.classList.remove('hidden');
        handleFetchTipoviPregleda();
    };

    pregledTypeSelect.onchange = handleFetchSlobodniTermini;
    pregledDateInput.onchange = handleFetchSlobodniTermini;
    
    mainContainer.appendChild(sidebar);
    mainContainer.appendChild(mainContent);

    return mainContainer;
}
