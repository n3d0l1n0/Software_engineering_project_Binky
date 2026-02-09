import { getZahteviZaPregled, prihvatiPregled, odbijPregled, getRasporedZaDan, getSviBuduciPregledi } from './preglediService.js';
import { fetchPorodilje } from './doctorPorodiljaService.js'; 
import { createDashboardCard } from '../components/dashboardCard.js';
import {createTextElement, clearElement} from '../utilis/functionUtilis.js';
import {getDatumiSvihPregleda} from './preglediService.js';

function createZahtevListItem(zahtev, onAction) {
    const li = document.createElement('li');
    li.className = 'p-4 border rounded-lg flex justify-between items-center';

    const info = document.createElement('div');
    const pacijent = createTextElement('p', zahtev?.leci?.porodilja?.imeIPrezime || 'Nepoznata pacijentkinja', 'font-bold');
    if (!zahtev?.leci?.porodilja?.imeIPrezime) pacijent.classList.add('text-red-500');

    const tipPregleda = zahtev?.tipPregleda?.naziv || 'Nepoznat tip';
    const termin = createTextElement('p', `${tipPregleda} - ${zahtev.termin}`, 'text-sm text-gray-600');
    info.append(pacijent, termin);

    const actions = document.createElement('div');
    actions.className = 'flex space-x-2';

    const prihvatiBtn = createTextElement('button', 'Prihvati', 'px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition');
    prihvatiBtn.innerHTML = '<i class="fas fa-check mr-2"></i>' + prihvatiBtn.textContent;
    prihvatiBtn.onclick = async () => {
        try {
            await prihvatiPregled(zahtev.id);
            alert('Pregled uspešno prihvaćen!');
            onAction();
        } catch (error) {
            alert('Došlo je do greške pri prihvatanju pregleda.');
        }
    };

    const odbijBtn = createTextElement('button', 'Odbij', 'px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition');
    odbijBtn.innerHTML = '<i class="fas fa-times mr-2"></i>' + odbijBtn.textContent;
    odbijBtn.onclick = async () => {
        if (confirm('Da li ste sigurni da želite da odbijete ovaj zahtev?')) {
            try {
                await odbijPregled(zahtev.id);
                alert('Pregled uspešno odbijen.');
                onAction();
            } catch (error) {
                alert('Došlo je do greške pri odbijanju pregleda.');
            }
        }
    };

    actions.append(prihvatiBtn, odbijBtn);
    li.append(info, actions);
    return li;
}

function createRasporedListItem(item) {
    const li = document.createElement('li');
    li.className = 'p-4 bg-pink-50 rounded-lg flex items-center';

    const timeEl = createTextElement('span', item.terminVreme, 'font-bold text-pink-600 text-lg mr-4');
    const info = document.createElement('div');
    info.append(
        createTextElement('p', item.porodilja, 'font-semibold text-gray-800'),
        createTextElement('p', `${item.tipPregleda} (${item.trajanje} min)`, 'text-sm text-gray-500')
    );
    li.append(timeEl, info);
    return li;
}

export function renderUpravljanjePregledima(mainContent) {
    clearElement(mainContent);
    const lekarId = localStorage.getItem('userId');
    if (!lekarId) {
        mainContent.appendChild(createTextElement('p', 'Greška: ID lekara nije pronađen.', 'text-red-500'));
        return;
    }

    mainContent.appendChild(Object.assign(document.createElement('header'), {
        className: 'mb-8',
        innerHTML: '<h2 class="text-4xl font-bold text-gray-800">Upravljanje pregledima</h2>'
    }));
    
    const layout = document.createElement('div');
    layout.className = 'grid grid-cols-1 lg:grid-cols-2 gap-8';

    const zahteviContainer = document.createElement('div');
    zahteviContainer.className = 'bg-white p-6 rounded-2xl shadow-lg flex flex-col h-[calc(100vh-12rem)]';
    const zahteviList = createTextElement('ul', 'Učitavanje zahteva...', 'space-y-4 overflow-y-auto');
    zahteviContainer.append(createTextElement('h3', 'Novi zahtevi za pregled', 'text-2xl font-semibold text-gray-700 mb-4 border-b pb-2 flex-shrink-0'), zahteviList);

    const rasporedContainer = document.createElement('div');
    rasporedContainer.className = 'bg-white p-6 rounded-2xl shadow-lg flex flex-col h-[calc(100vh-12rem)]';
    const rasporedList = createTextElement('ul', 'Učitavanje rasporeda...', 'space-y-4 overflow-y-auto');
    rasporedContainer.append(createTextElement('h3', 'Raspored za danas', 'text-2xl font-semibold text-gray-700 mb-4 border-b pb-2 flex-shrink-0'), rasporedList);

    layout.append(zahteviContainer, rasporedContainer);
    mainContent.appendChild(layout);

    getZahteviZaPregled(lekarId).then(data => {
        clearElement(zahteviList);
        const zahtevi = data?.$values || data;
        if (zahtevi && Array.isArray(zahtevi) && zahtevi.length > 0) {
            zahtevi.forEach(zahtev => zahteviList.appendChild(createZahtevListItem(zahtev, () => renderUpravljanjePregledima(mainContent))));
        } else {
            zahteviList.appendChild(createTextElement('p', 'Trenutno nema novih zahteva.', 'text-gray-500'));
        }
    }).catch(err => {
        console.error("Greška pri dohvatanju zahteva:", err);
        clearElement(zahteviList);
        zahteviList.appendChild(createTextElement('p', 'Došlo je do greške pri učitavanju zahteva.', 'text-red-500'));
    });

    const danas = new Date().toISOString().split('T')[0];
    getRasporedZaDan(lekarId, danas).then(data => {
        clearElement(rasporedList);
        const raspored = data?.$values || data;
        if (raspored && Array.isArray(raspored) && raspored.length > 0) {
            raspored.forEach(item => rasporedList.appendChild(createRasporedListItem(item)));
        } else {
            rasporedList.appendChild(createTextElement('p', 'Nema zakazanih pregleda za danas.', 'text-gray-500'));
        }
    }).catch(err => {
        console.error("Greška pri dohvatanju rasporeda:", err);
        clearElement(rasporedList);
        rasporedList.appendChild(createTextElement('p', 'Došlo je do greške pri učitavanju rasporeda.', 'text-red-500'));
    });
}

function buildCalendar(container, eventDates, onDateClick) {
    const calendarWrapper = document.createElement('div');
    let currentDate = new Date();
    let activeCell = null;

    function renderMonth(date) {
        calendarWrapper.innerHTML = '';
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthName = new Date(year, month).toLocaleString('sr-RS', { month: 'long' });

        const calendarHeader = document.createElement('div');
        calendarHeader.className = 'flex justify-between items-center mb-4';
        const prevButton = Object.assign(document.createElement('button'), { innerHTML: '<i class="fas fa-chevron-left"></i>', className: 'px-3 py-2 rounded-lg hover:bg-gray-100' });
        const nextButton = Object.assign(document.createElement('button'), { innerHTML: '<i class="fas fa-chevron-right"></i>', className: 'px-3 py-2 rounded-lg hover:bg-gray-100' });
        prevButton.onclick = () => { currentDate.setMonth(month - 1); renderMonth(currentDate); };
        nextButton.onclick = () => { currentDate.setMonth(month + 1); renderMonth(currentDate); };
        calendarHeader.append(prevButton, createTextElement('h4', `${monthName} ${year}`, 'text-xl font-semibold capitalize'), nextButton);

        const daysGrid = document.createElement('div');
        daysGrid.className = 'grid grid-cols-7 gap-2 text-center';
        ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'].forEach(day => daysGrid.appendChild(createTextElement('div', day, 'font-bold text-gray-600 p-2')));

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const offset = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;
        for (let i = 0; i < offset; i++) daysGrid.appendChild(document.createElement('div'));
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(year, month, day);
            cellDate.setHours(0, 0, 0, 0);
            const cellDateString = new Date(Date.UTC(year, month, day)).toISOString().split('T')[0];
            
            const dayCell = createTextElement('div', day, 'p-2 rounded-full cursor-pointer transition-colors');
            
            const isEvent = eventDates.includes(cellDateString);
            const isPast = cellDate < today;
            const isToday = cellDate.getTime() === today.getTime();

            if (isToday) {
                dayCell.classList.add('bg-blue-500', 'text-white');
            } else if (isEvent && !isPast) { 
                dayCell.classList.add('bg-pink-200', 'font-bold', 'text-pink-700');
            } else {
                dayCell.classList.add('hover:bg-gray-100');
            }

            dayCell.addEventListener('click', () => {
                if (activeCell) {
                    activeCell.classList.remove('ring-2', 'ring-pink-500');
                }
                dayCell.classList.add('ring-2', 'ring-pink-500');
                activeCell = dayCell;
                onDateClick(cellDateString); 
            });
            daysGrid.appendChild(dayCell);
        }
        calendarWrapper.append(calendarHeader, daysGrid);
    }

    renderMonth(currentDate);
    container.appendChild(calendarWrapper);
}

export function renderRasporedPregleda(mainContent) {
    clearElement(mainContent);
    const lekarId = localStorage.getItem('userId');
    if (!lekarId) {
        mainContent.innerHTML = '<p class="text-red-500">Greška: ID lekara nije pronađen.</p>';
        return;
    }

    mainContent.innerHTML = `
        <header class="mb-8">
            <h2 class="text-4xl font-bold text-gray-800">Raspored pregleda</h2>
            <p class="text-gray-500 mt-1">Kalendarski prikaz svih zakazanih pregleda. Kliknite na datum da vidite detalje.</p>
        </header>
    `;

    const layout = document.createElement('div');
    layout.className = 'grid grid-cols-1 lg:grid-cols-2 gap-8 items-start';

    const calendarContainer = createTextElement('div', 'Učitavanje kalendara...', 'bg-white p-6 rounded-2xl shadow-lg');
    
    const rasporedContainer = document.createElement('div');
    rasporedContainer.className = 'bg-white p-6 rounded-2xl shadow-lg flex flex-col h-[calc(100vh-12rem)]';

    layout.append(calendarContainer, rasporedContainer);
    mainContent.appendChild(layout);
    
    const renderDnevniRaspored = (dateString) => {
        const datum = new Date(dateString).toLocaleDateString('sr-RS', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        
        rasporedContainer.innerHTML = ''; 
        const header = createTextElement('h3', `Raspored za ${datum}`, 'text-2xl font-semibold text-gray-700 mb-4 border-b pb-2 flex-shrink-0');
        const list = createTextElement('ul', 'Učitavanje rasporeda...', 'space-y-4 overflow-y-auto');
        rasporedContainer.append(header, list);

        getRasporedZaDan(lekarId, dateString).then(data => {
            clearElement(list);
            const raspored = data?.$values || data;
            if (raspored && Array.isArray(raspored) && raspored.length > 0) {
                raspored.forEach(item => {
                    const terminVreme = new Date(item.termin).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
                    list.appendChild(createRasporedListItem({ ...item, terminVreme }));
                });
            } else {
                list.appendChild(createTextElement('p', 'Nema zakazanih pregleda za ovaj dan.', 'text-gray-500'));
            }
        }).catch(err => {
            console.error("Greška pri dohvatanju rasporeda za dan:", err);
            clearElement(list);
            list.appendChild(createTextElement('p', 'Došlo je do greške pri učitavanju rasporeda.', 'text-red-500'));
        });
    };

    rasporedContainer.appendChild(createTextElement('p', 'Izaberite datum iz kalendara da biste videli raspored.', 'text-gray-500 text-center mt-4'));

    getDatumiSvihPregleda(lekarId).then(data => {
        clearElement(calendarContainer);
        const datumi = data?.$values || data;
        const eventDates = [...new Set(datumi.map(p => new Date(p).toISOString().split('T')[0]))];
        buildCalendar(calendarContainer, eventDates, renderDnevniRaspored);
    }).catch(err => {
        console.error("Greška pri učitavanju datuma pregleda:", err);
        calendarContainer.innerHTML = '<p class="text-red-500">Došlo je do greške pri učitavanju kalendara.</p>';
    });
}

export function renderDashboard(mainContent) {
    clearElement(mainContent);

    mainContent.innerHTML = `
        <header class="mb-8">
            <h2 class="text-4xl font-bold text-gray-800">Dobrodošli!</h2>
            <p class="text-gray-500 mt-1">Pregled vaših današnjih aktivnosti.</p>
        </header>
    `;
    const cardsGrid = document.createElement('div');
    cardsGrid.className = 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-10';
    mainContent.appendChild(cardsGrid);

    const patientCard = createDashboardCard('Ukupno pacijentkinja', '-', 'fas fa-user-friends', { border: 'border-pink-400', text: 'text-pink-600', bg: 'bg-pink-100' });
    const appointmentsCard = createDashboardCard('Današnji pregledi', '-', 'fas fa-calendar-day', { border: 'border-purple-400', text: 'text-purple-600', bg: 'bg-purple-100' });
    const requestsCard = createDashboardCard('Novi zahtevi', '-', 'fas fa-inbox', { border: 'border-red-400', text: 'text-red-600', bg: 'bg-red-100' });
    cardsGrid.append(patientCard, appointmentsCard, requestsCard);

    const lekarId = localStorage.getItem('userId');
    if (lekarId) {
        fetchPorodilje(lekarId).then(data => {
            patientCard.querySelector('.text-3xl').textContent = (data?.$values || data).length;
        });

        const danas = new Date().toISOString().split('T')[0];
        getRasporedZaDan(lekarId, danas).then(data => {
            appointmentsCard.querySelector('.text-3xl').textContent = (data?.$values || data).length;
        });

        getZahteviZaPregled(lekarId).then(data => {
            requestsCard.querySelector('.text-3xl').textContent = (data?.$values || data).length;
        });
    }
}