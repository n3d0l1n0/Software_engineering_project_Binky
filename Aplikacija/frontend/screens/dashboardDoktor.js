import { createNavItem } from '../components/navBar.js';
import { renderDashboard } from '../services/doctorPregledService.js';
import { renderUpravljanjePregledima } from '../services/doctorPregledService.js';
import { renderRasporedPregleda } from '../services/doctorPregledService.js';
import { renderPreporuke } from '../services/doctorPreporukaService.js';
import {renderListaPacijentkinja} from '../services/doctorPorodiljaService.js';
import { renderLekarProfilePage } from '../services/lekarProfil.js';

export default function DoktorDashboard() {
    const mainContainer = document.createElement('div');
    mainContainer.className = 'min-h-screen bg-gray-50';

    const dashboardWrapper = document.createElement('div');
    dashboardWrapper.className = 'relative min-h-screen md:flex';

    const sidebar = document.createElement('aside');
    sidebar.className = `
        w-64 bg-white shadow-xl p-6 flex flex-col justify-between border-r border-pink-100 
        transform -translate-x-full md:translate-x-0 
        transition-transform duration-300 ease-in-out 
        fixed md:relative h-screen z-20
    `;
    sidebar.id = 'sidebar';

    const mainContent = document.createElement('main');
    mainContent.className = 'flex-1 p-8 overflow-y-auto min-w-0';

    const mobileMenuButton = document.createElement('button');
    mobileMenuButton.className = 'md:hidden fixed top-4 right-4 bg-white p-2 rounded-md shadow-lg z-30';
    mobileMenuButton.innerHTML = `<i class="fas fa-bars text-pink-600 text-xl"></i>`;

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black opacity-50 z-10 hidden md:hidden';
    overlay.id = 'overlay';


    function toggleMenu() {
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    }

    mobileMenuButton.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu); 

    const navContent = document.createElement('div');

    const logo = document.createElement('h1');
    logo.className = 'text-3xl font-extrabold text-pink-600 mb-8 tracking-wider';
    logo.textContent = 'BINKY';
    navContent.appendChild(logo);

    const nav = document.createElement('nav');
    nav.className = 'space-y-3';

    const dashboardLink = createNavItem('fas fa-tachometer-alt', 'Kontrolna tabla', true);
    const patientListLink = createNavItem('fas fa-users', 'Lista pacijentkinja');
    const preglediLink = createNavItem('fas fa-calendar-alt', 'Pregledi');
    const scheduleLink = createNavItem('fas fa-calendar-check', 'Raspored pregleda');
    const preporukeLink = createNavItem('fas fa-notes-medical', 'Preporuke');
    const userLink = createNavItem('fas fa-user', 'Korisnički profil');

    nav.appendChild(dashboardLink);
    nav.appendChild(patientListLink);
    nav.appendChild(preglediLink);
    nav.appendChild(scheduleLink);
    nav.appendChild(userLink);
    navContent.appendChild(nav);
    nav.appendChild(preporukeLink);

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'w-full mt-8 py-2 px-4 text-sm bg-gray-200 hover:bg-red-500 hover:text-white rounded-xl transition duration-200 font-semibold text-gray-700';
    logoutBtn.classList.add('odjaviSeButton');

    const logoutIcon = document.createElement('i');
    logoutIcon.className = 'fas fa-sign-out-alt mr-2';
    const logoutText = document.createTextNode(' Odjavi se');
    logoutBtn.appendChild(logoutIcon);
    logoutBtn.appendChild(logoutText);

    sidebar.appendChild(navContent);
    sidebar.appendChild(logoutBtn);

    function setActive(selectedLink) {
        [dashboardLink, patientListLink, preglediLink, scheduleLink, preporukeLink, userLink].forEach(link => {
            link.className = 'flex items-center p-3 rounded-xl transition duration-200 text-gray-700 hover:bg-pink-50 hover:text-pink-500';
        });
        selectedLink.className = 'flex items-center p-3 rounded-xl transition duration-200 bg-pink-100 font-semibold text-pink-600 shadow-md';
        
        if (window.innerWidth < 768) { 
            toggleMenu();
        }
    }

    dashboardLink.addEventListener('click', (e) => { e.preventDefault(); setActive(dashboardLink); renderDashboard(mainContent); });
    patientListLink.addEventListener('click', (e) => { e.preventDefault(); setActive(patientListLink); renderListaPacijentkinja(mainContent); });
    preglediLink.addEventListener('click', (e) => { e.preventDefault(); setActive(preglediLink); renderUpravljanjePregledima(mainContent); });
    scheduleLink.addEventListener('click', (e) => { e.preventDefault(); setActive(scheduleLink); renderRasporedPregleda(mainContent); });
    preporukeLink.addEventListener('click', (e) => { e.preventDefault(); setActive(preporukeLink); renderPreporuke(mainContent); });
    userLink.addEventListener('click', (e) => { e.preventDefault(); setActive(userLink); renderLekarProfilePage(mainContent); });

    renderDashboard(mainContent);
    
    dashboardWrapper.appendChild(overlay);
    dashboardWrapper.appendChild(mobileMenuButton);
    dashboardWrapper.appendChild(sidebar);
    dashboardWrapper.appendChild(mainContent);
    
    mainContainer.appendChild(dashboardWrapper);
    
    return mainContainer;
}