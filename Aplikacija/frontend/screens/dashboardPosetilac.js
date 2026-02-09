import { VelicinaPloda } from '../models/velicinaPloda.js';

export default async function DashboardPosetilac() {
    const container = document.createElement('div');
    container.className = 'min-h-screen md:flex bg-gradient-to-br from-pink-200 to-blue-200';

    const mobileMenuButton = document.createElement('button');
    mobileMenuButton.className = 'md:hidden fixed top-4 left-4 bg-white p-2 rounded-md shadow-lg z-30'; // Prikazan samo na mobilnom
    mobileMenuButton.innerHTML = `<i class="fas fa-bars text-pink-600 text-xl"></i>`;

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-10 hidden md:hidden';

    const sidebar = document.createElement('aside');
    sidebar.className =`
        w-64 bg-white shadow-xl p-6 flex flex-col justify-start border-r border-pink-100
        transform -translate-x-full md:translate-x-0
        transition-transform duration-300 ease-in-out
        fixed md:relative h-screen md:h-auto z-20
    `;

    function toggleMenu() {
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    }

    mobileMenuButton.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu); 


    const logo = document.createElement('h1');
    logo.className = 'text-3xl md:text-4xl font-extrabold text-pink-600 mb-8 tracking-widest uppercase text-center md:text-left';
    logo.textContent = 'BINKY';
    sidebar.appendChild(logo);

    const infoSection = document.createElement('div');
    infoSection.className = 'space-y-3 text-gray-700 text-center';

    const porodiljaId = localStorage.getItem('userId');
    if (porodiljaId) {
        try {
            const porodilja = await getPorodiljaInfoById(porodiljaId);

            if (porodilja) {
                const imeEl = document.createElement('p');
                imeEl.className = 'text-xl font-semibold text-pink-600';
                imeEl.textContent = porodilja.imeIPrezime;

                const datumEl = document.createElement('p');
                datumEl.innerHTML = `<span class="font-semibold text-pink-500">Datum rođenja:</span> ${formatDatum(porodilja.datumRodjenja)}`;

                const nedeljaTrudnoce = porodilja.pocetakTrudnoce
                    ? Math.floor((new Date() - new Date(porodilja.pocetakTrudnoce)) / (1000*60*60*24*7)) + 1
                    : 'Nepoznata';
                const trudnocaEl = document.createElement('p');
                trudnocaEl.innerHTML = `<span class="font-semibold text-pink-500">Nedelja trudnoće:</span> ${nedeljaTrudnoce}`;

                const porodilaEl = document.createElement('p');
                porodilaEl.innerHTML = `<span class="font-semibold text-pink-500">Status:</span> ${
                    porodilja.sePorodila ? 'Ja sam se porodila! 👶' : 'Trudnoća u toku 🤰'
                }`;
                
                const velicinaPloda = document.createElement('p');
                velicinaPloda.innerHTML = `<span class="font-semibold text-pink-500">Beba je veličine:</span> ${
                    porodilja.sePorodila ? 'Bebe' : (VelicinaPloda[nedeljaTrudnoce] || 'Nepoznato')
                }`;

                infoSection.append(imeEl, datumEl, trudnocaEl, porodilaEl, velicinaPloda);
            } else {
                infoSection.textContent = 'Greška prilikom učitavanja podataka.';
            }
        } catch (error) {
            console.error("Greška pri dohvatanju podataka o porodilji:", error);
            return container;
        }
    } else {
        return container;
    }

    sidebar.appendChild(infoSection);

    const preglediSection = document.createElement('main');
    preglediSection.className = 'flex-1 flex flex-col items-center p-4 md:p-8 text-gray-700 text-xl overflow-y-auto w-full';

    const karticeContainer = document.createElement('div');
    karticeContainer.className = 'w-full max-w-4xl space-y-6';

    try {
        const data = await getDozvoljeniPregledi(porodiljaId);
        const sviPregledi = data?.$values || [];
        
        if (sviPregledi.length > 0) {
            sviPregledi.forEach(p => {
                const kartica = document.createElement('div');
                kartica.className = 'w-full bg-white rounded-2xl shadow-xl p-6 text-left border border-pink-200 transition duration-300 hover:shadow-2xl';
    
                const pocetak = new Date(p.termin);
                const kraj = new Date(pocetak.getTime() + p.trajanje * 60000);
    
                const formatVreme = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    
                kartica.innerHTML = `
                    <p class="text-center font-semibold text-pink-500 mb-3">Zakazan Pregled</p>
                    <p><span class="font-semibold text-pink-500">Datum:</span> ${formatDatum(p.termin)}</p>
                    <p><span class="font-semibold text-pink-500">Termin:</span> ${formatVreme(pocetak)} - ${formatVreme(kraj)}</p>
                    <p><span class="font-semibold text-pink-500">Tip pregleda:</span> ${p.tipPregleda}</p>
                    <p><span class="font-semibold text-pink-500">Lekar:</span> ${p.lekar}</p>
                `;
                karticeContainer.appendChild(kartica);
            });
        } else {
            karticeContainer.innerHTML = `<div class="text-center p-10 bg-white/50 rounded-lg"><p>Porodilja trenutno nema preglede za prikaz.</p></div>`;
        }
    } catch (error) {
        karticeContainer.innerHTML = `<div class="text-center p-10 bg-white/50 rounded-lg"><p class="text-red-500">Došlo je do greške pri učitavanju pregleda.</p></div>`;
    }

    preglediSection.appendChild(karticeContainer);

    container.append(mobileMenuButton, overlay, sidebar, preglediSection);
    
    return container;
}

export function formatDatum(isoDatum) {
    const date = new Date(isoDatum);
    const dan = String(date.getDate()).padStart(2, '0');
    const mesec = String(date.getMonth() + 1).padStart(2, '0');
    const godina = date.getFullYear();
    return `${dan}.${mesec}.${godina}.`;
}

export async function getPorodiljaInfoById(id) {
    if (!id) throw new Error('ID porodilje nije prosleđen.');

    try {
        const response = await fetch(`http://localhost:5278/porodilja/Porodilja/porodilja/${id}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Greška prilikom preuzimanja podataka.');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Greška u getPorodiljaInfoById:', error);
        return null;
    }
}

export async function getDozvoljeniPregledi(porodiljaId) {
    if (!porodiljaId) throw new Error("ID porodilje nije prosleđen.");

    try {
        const response = await fetch(`http://localhost:5278/pregled/Pregled/dozvoljeni-pregledi/${porodiljaId}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Greška prilikom preuzimanja pregleda.");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Greška u getDozvoljeniPregledi:", error);
        return { $values: [] };
    }
}