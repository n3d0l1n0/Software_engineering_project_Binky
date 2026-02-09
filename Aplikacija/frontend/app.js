import porodilja from './screens/dashboardPorodilja.js';
import Homepage from './screens/homepage.js';
import LoginPage from './screens/login.js';
import SearchPage from './screens/pretrazi.js';
import RegisterPage from './screens/register.js';
import DoktorDashboard from './screens/dashboardDoktor.js';
import DashboardPosetilac from './screens/dashboardPosetilac.js';
import { logout } from './services/authService.js';

const root = document.getElementById('root');
let isLoggedIn = false;

function getPath(pageComponent) {
    if (pageComponent === LoginPage) return '#/login';
    if (pageComponent === DoktorDashboard) return '#/doktor-dashboard';
    if (pageComponent === porodilja) return '#/porodilja-dashboard';
    if (pageComponent === RegisterPage) return '#/register';
    if (pageComponent === SearchPage) return '#/search';
    if( pageComponent === DashboardPosetilac) return '#/posetilac-dashboard';
    return '#/';
}

function getPathForLoggedUser() {
    const userType = localStorage.getItem('userType');
    if (userType === 'porodilja') return '#/porodilja-dashboard';
    if (userType === 'lekar') return '#/doktor-dashboard';
    return '#/'; 
}

async function renderPage(pageComponent) {
    if (!root) return;

    const userType = localStorage.getItem('userType');
    if ((pageComponent === porodilja && userType !== 'porodilja') ||
        (pageComponent === DoktorDashboard && userType !== 'lekar')) {
        renderPage(LoginPage, true);
        return;
    }

    if(pageComponent === DashboardPosetilac){
        const porodiljaId = localStorage.getItem('userId');
        if(!porodiljaId){
            renderPage(SearchPage);
            return;
        }
    }

    root.innerHTML = '';
    const newPage = await pageComponent({ renderPage });

    const path = getPath(pageComponent);
    window.location.hash = path;

    if (pageComponent === Homepage) attachHomepageListeners(newPage);
    else if (pageComponent === DoktorDashboard || pageComponent === porodilja || pageComponent === DashboardPosetilac) attachLogoutListener(newPage);
    else attachBackListener(newPage);

    root.appendChild(newPage);
}

function attachHomepageListeners(page) {
    const loginBtn = page.querySelector('button[data-action="login"]');
    const registerBtn = page.querySelector('button[data-action="register"]');
    const searchBtn = page.querySelector('button[data-action="search"]');

    if (loginBtn) loginBtn.onclick = () => renderPage(LoginPage);
    if (registerBtn) registerBtn.onclick = () => renderPage(RegisterPage);
    if (searchBtn) searchBtn.onclick = () => renderPage(SearchPage);
}

function attachBackListener(page) {
    const backBtn = page.querySelector('button[type="button"]');
    if (backBtn) backBtn.onclick = () => renderPage(Homepage);
}

async function handleLogout() {
    await logout();
    isLoggedIn = false;
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    localStorage.removeItem('selectedLekarId');
    localStorage.removeItem('selectedLekarIme');
    renderPage(Homepage, true);
}

function attachLogoutListener(page) {
    const logoutButton = page.querySelector('.odjaviSeButton');
    if (logoutButton) {
        logoutButton.onclick = (e) => {
            e.preventDefault();
            handleLogout();
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash || '#/';
    let initialComponent = Homepage;

    if (hash === '#/login') initialComponent = LoginPage;
    else if (hash === '#/register') initialComponent = RegisterPage;
    else if (hash === '#/search') initialComponent = SearchPage;
    else if (hash === '#/doktor-dashboard') initialComponent = DoktorDashboard;
    else if (hash === '#/porodilja-dashboard') initialComponent = porodilja;
    else if (hash === '#/posetilac-dashboard') initialComponent = DashboardPosetilac;

    renderPage(initialComponent);
});

window.addEventListener('hashchange', () => {
    const hash = window.location.hash || '#/';
    const publicPages = ['#/', '#/login', '#/register', '#/search'];

    const userIsLoggedIn = !!localStorage.getItem('userType');
    const visitorHasAccess = !!localStorage.getItem('userId');

    if (userIsLoggedIn && publicPages.includes(hash)) {
        handleLogout();
        return; 
    }

    if (visitorHasAccess && !userIsLoggedIn && hash !== '#/posetilac-dashboard') {
        localStorage.removeItem('userId');
    }

    if (hash === '#/login') renderPage(LoginPage);
    else if (hash === '#/register') renderPage(RegisterPage);
    else if (hash === '#/search') renderPage(SearchPage);
    else if (hash === '#/doktor-dashboard') renderPage(DoktorDashboard);
    else if (hash === '#/porodilja-dashboard') renderPage(porodilja);
    else if (hash === '#/posetilac-dashboard') renderPage(DashboardPosetilac);
    else if (!userIsLoggedIn) {
        renderPage(Homepage);
    }
});