import { getAuthToken } from './authService.js';
import { getProsliPregledi } from './preglediService.js';
import { getRezultatiZaPregled, createRezultat } from './rezultatService.js';
import { uploadDocument } from './storageService.js';
import {createTextElement, clearElement} from '../utilis/functionUtilis.js';
import {formatUTCToCET} from '../utilis/dateUtilis.js';

export function izracunajNedeljuTrudnoce(pocetakTrudnoce) {
    if (!pocetakTrudnoce) {
        return 'N/A';
    }
    const pocetak = new Date(pocetakTrudnoce);
    const danas = new Date();
    const diffTime = Math.abs(danas - pocetak);
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    return `${diffWeeks}. nedelja`;
}

async function azurirajStatusPorodilje(porodiljaId, sePorodila) {
    const token = getAuthToken();
    if (!token) throw new Error('Token za autorizaciju nije pronađen.');

    if (!sePorodila) {
        alert('Akcija nije moguća. Status se može samo promeniti u "porodila se".');
        throw new Error('Operacija vraćanja statusa nije podržana.');
    }

    const url = `http://localhost:5278/porodilja/Porodilja/porodila_se/${porodiljaId}`;
    try {
        await axios.put(url, null, { headers: { 'Authorization': `Bearer ${token}` } });
    } catch (error) {
        console.error('Greška pri ažuriranju statusa porodilje:', error.response || error);
        throw new Error('Nije uspelo ažuriranje statusa. Molimo pokušajte ponovo.');
    }
}

export async function fetchPorodilje(lekarId) {
    const token = getAuthToken();
    if (!token) {
        console.error('Token nije pronađen, prekidam zahtev.');
        return [];
    }

    try {
        const response = await axios.get(`http://localhost:5278/leci/Leci/porodilje_lekara/${lekarId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data?.$values || [];
    } catch (error) {
        console.error('Greška pri dohvatanju porodilja:', error.response || error.message || error);
        if (error.response?.status === 401) {
            alert('Niste autorizovani. Molimo prijavite se ponovo.');
        }
        return [];
    }
}

function createPorodiljaListItem(leci, mainContent) {
    if (!leci || !leci.porodilja) {
        console.warn('Pokušaj kreiranja stavke za pacijentkinju sa nekompletnim podacima:', leci);
        return document.createDocumentFragment();
    }
    const porodilja = leci.porodilja;

    const li = document.createElement('li');
    li.className = 'flex justify-between items-center text-gray-700 p-3 hover:bg-gray-100 rounded-lg cursor-pointer';
    li.onclick = () => prikaziDetaljePorodiljeModal(porodilja, mainContent);

    const infoContainer = document.createElement('div');
    infoContainer.className = 'flex items-center';
    const icon = document.createElement('i');
    icon.className = 'fas fa-user-injured text-pink-500 mr-3';

    const textContainer = document.createElement('div');
    const strongText = document.createElement('strong');
    strongText.textContent = `${porodilja.imeIPrezime}`;
    const nedeljaTrudnoce = createTextElement('span', izracunajNedeljuTrudnoce(porodilja.pocetakTrudnoce), 'text-sm text-gray-500 ml-2');

    textContainer.append(strongText, nedeljaTrudnoce);
    infoContainer.append(icon, textContainer);
    li.append(infoContainer);
    return li;
}

async function prikaziDetaljePorodiljeModal(porodilja, mainContent) {
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden';
    modal.addEventListener('click', (e) => e.stopPropagation());

    const header = document.createElement('div');
    header.className = 'flex-shrink-0 flex justify-between items-center p-6 border-b';
    header.append(
        createTextElement('h3', 'Detalji pacijentkinje', 'text-2xl font-bold text-gray-800'),
        Object.assign(document.createElement('button'), {
            className: 'text-gray-500 hover:text-gray-800 transition-colors',
            innerHTML: '<i class="fas fa-times fa-lg"></i>',
            onclick: () => backdrop.remove()
        })
    );
    const contentArea = document.createElement('div');
    contentArea.className = 'overflow-y-auto p-6';

    const body = document.createElement('div');
    body.className = 'space-y-4';
    const createDetailRow = (label, value) => {
        const row = document.createElement('div');
        row.className = 'flex justify-between items-center';
        row.append(
            createTextElement('span', label, 'font-semibold text-gray-600'),
            createTextElement('span', value, 'text-gray-800 text-right')
        );
        return row;
    };
    body.append(
        createDetailRow('Ime i prezime:', porodilja.imeIPrezime),
        createDetailRow('LBO:', porodilja.lbo),
        createDetailRow('Nedelja trudnoće:', izracunajNedeljuTrudnoce(porodilja.pocetakTrudnoce))
    );

    const form = document.createElement('form');
    form.id = 'patient-update-form'; 
    form.className = 'mt-6 pt-6 border-t';
    const statusDiv = document.createElement('div');
    statusDiv.className = 'flex items-center p-3 rounded-lg bg-gray-50';
    const checkbox = Object.assign(document.createElement('input'), {
        type: 'checkbox', id: 'sePorodilaCheckbox', checked: porodilja.sePorodila,
        className: 'h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer'
    });
    const label = Object.assign(document.createElement('label'), {
        htmlFor: 'sePorodilaCheckbox', textContent: 'Status: Pacijentkinja se porodila',
        className: 'ml-3 text-md font-medium text-gray-700 cursor-pointer'
    });
    statusDiv.append(checkbox, label);

    const istorijaHeader = createTextElement('h4', 'Istorija pregleda', 'text-xl font-semibold text-gray-700 mt-6 border-t pt-4');
    const istorijaListContainer = createTextElement('div', 'Učitavanje istorije pregleda...', 'space-y-3 mt-4');

    contentArea.append(body, form, istorijaHeader, istorijaListContainer);

    const footer = document.createElement('div');
    footer.className = 'flex justify-end space-x-4 p-6 border-t';
    const cancelBtn = Object.assign(createTextElement('button', 'Zatvori', 'px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold'), { type: 'button' });
    const saveBtn = Object.assign(createTextElement('button', 'Sačuvaj izmene', 'px-5 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-semibold'), { type: 'submit' });
    saveBtn.setAttribute('form', 'patient-update-form');
    footer.append(cancelBtn, saveBtn);

    form.append(statusDiv, footer);

    modal.append(header, contentArea, footer);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    const closeModal = () => backdrop.remove();
    cancelBtn.onclick = closeModal;
    backdrop.addEventListener('click', closeModal);

    form.onsubmit = async (e) => {
        e.preventDefault();
        saveBtn.disabled = true;
        saveBtn.textContent = 'Čuvanje...';
        try {
            await azurirajStatusPorodilje(porodilja.id, checkbox.checked);
            alert('Status je uspešno ažuriran!');
            closeModal();
            renderListaPacijentkinja(mainContent);
        } catch (error) {
            alert(error.message || 'Došlo je do greške pri čuvanju statusa.');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Sačuvaj izmene';
        }
    };
    
    try {
        const prosliPregledi = await getProsliPregledi(porodilja.id);
        istorijaListContainer.innerHTML = '';
        if (prosliPregledi && prosliPregledi.length > 0) {
            prosliPregledi.forEach(pregled => {
                const item = document.createElement('div');
                item.className = 'flex justify-between items-center p-3 bg-gray-50 rounded-lg';
                const pregledInfo = document.createElement('div');
                pregledInfo.append(
                    createTextElement('p', pregled.tipPregleda, 'font-semibold text-gray-800'),
                    createTextElement('p', formatUTCToCET(pregled.termin), 'text-sm text-gray-500')
                );
                const rezultatiBtn = createTextElement('button', 'Dodaj/Vidi rezultate', 'px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm');
                rezultatiBtn.onclick = () => showRezultatiModal(pregled, porodilja);
                item.append(pregledInfo, rezultatiBtn);
                istorijaListContainer.appendChild(item);
            });
        } else {
            istorijaListContainer.textContent = 'Nema završenih pregleda.';
        }
    } catch (error) {
        istorijaListContainer.textContent = 'Greška pri učitavanju pregleda.';
        console.error('Greška pri dohvatanju prošlih pregleda:', error);
    }
}

async function showRezultatiModal(pregled, porodilja) {
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    const closeModal = () => backdrop.remove();
    backdrop.addEventListener('click', closeModal);

    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[95vh] overflow-hidden';
    modal.addEventListener('click', (e) => e.stopPropagation());

    const header = document.createElement('div');
    header.className = 'flex-shrink-0 flex justify-between items-center p-6 border-b';
    header.append(
        createTextElement('h3', `Rezultati za pregled: ${pregled.tipPregleda}`, 'text-2xl font-bold text-gray-800'),
        Object.assign(document.createElement('button'), {
            className: 'text-gray-500 hover:text-gray-800 transition-colors',
            innerHTML: '<i class="fas fa-times fa-lg"></i>',
            onclick: closeModal
        })
    );

    const contentArea = document.createElement('div');
    contentArea.className = 'overflow-y-auto p-6'; 

    const postojeciRezultatiTitle = createTextElement('h4', 'Postojeći rezultati', 'text-lg font-semibold text-gray-700');
    const rezultatiList = createTextElement('div', 'Učitavanje rezultata...', 'space-y-2 my-4 max-h-48 overflow-y-auto');

    const uploadForm = document.createElement('form');
    uploadForm.className = 'mt-6 pt-6 border-t';
    const formTitle = createTextElement('h4', 'Dodaj novi rezultat', 'text-lg font-semibold mb-3 text-gray-700');
    
    const tipLabel = createTextElement('label', 'Tip rezultata', 'block text-sm font-medium text-gray-700');
    const tipSelect = document.createElement('select');
    tipSelect.className = 'mt-1 block w-full p-2 border border-gray-300 rounded-md';
    const tipovi = { 'Krvna slika': 0, 'Biohemija': 1, 'Ultrazvuk': 2, 'Urinokultura': 3, 'Nalaz sa infektologije': 4, 'Prenatalni test': 5 };
    for (const [text, value] of Object.entries(tipovi)) {
        tipSelect.add(new Option(text, value));
    }

    const fileLabel = createTextElement('label', 'Izaberite fajl', 'block text-sm font-medium text-gray-700 mt-4');
    const fileInput = Object.assign(document.createElement('input'), {
        type: 'file', accept: 'application/pdf,image/*', required: true,
        className: 'mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100'
    });

    const submitBtn = Object.assign(createTextElement('button', 'Sačuvaj rezultat', 'mt-4 px-5 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600'), { type: 'submit' });
    uploadForm.append(formTitle, tipLabel, tipSelect, fileLabel, fileInput, submitBtn);

    contentArea.append(postojeciRezultatiTitle, rezultatiList, uploadForm);

    const footer = document.createElement('div');
    footer.className = 'flex-shrink-0 flex justify-end p-6 border-t';
    const closeBtn = createTextElement('button', 'Zatvori', 'px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold');
    closeBtn.onclick = closeModal;
    footer.appendChild(closeBtn);

    modal.append(header, contentArea, footer);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    const refreshRezultati = async () => {
        try {
            const rezultati = await getRezultatiZaPregled(pregled.pregledId);
            rezultatiList.innerHTML = '';
            if (rezultati && Array.isArray(rezultati) && rezultati.length > 0) {
                rezultati.forEach(rezultat => {
                    if (rezultat.sadrzaj) {
                        const item = Object.assign(document.createElement('a'), {
                            href: rezultat.sadrzaj, target: '_blank', rel: 'noopener noreferrer',
                            className: 'block p-2 bg-gray-100 rounded hover:bg-gray-200',
                            textContent: `Rezultat od ${new Date(rezultat.datum).toLocaleDateString('sr-RS')} - Pogledaj`
                        });
                        rezultatiList.appendChild(item);
                    }
                });
            } else {
                rezultatiList.textContent = 'Nema rezultata za ovaj pregled.';
            }
        } catch (error) {
            rezultatiList.textContent = 'Greška pri učitavanju rezultata.';
            console.error('Greška:', error);
        }
    };
    
    await refreshRezultati();

    uploadForm.onsubmit = async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        if (!file) return alert('Molimo izaberite fajl.');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Otpremanje...';

        try {
            const uploadResult = await uploadDocument(porodilja.id.toString(), file);
            if (!uploadResult.success) throw new Error(uploadResult.message || 'Greška prilikom uploada.');
            
            submitBtn.textContent = 'Čuvanje...';
            const rezultatData = {
                Datum: new Date().toISOString(),
                Tip: tipSelect.options[tipSelect.selectedIndex].text,
                Sadrzaj: uploadResult.publicUrl,
                IdPregleda: pregled.pregledId
            };
            await createRezultat(rezultatData);
            alert('Rezultat je uspešno sačuvan!');
            uploadForm.reset();
            await refreshRezultati();
        } catch (error) {
            alert(`Došlo je do greške: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sačuvaj rezultat';
        }
    };
}

export async function renderListaPacijentkinja(mainContent) {
    clearElement(mainContent);
    mainContent.appendChild(createTextElement('h2', 'Učitavanje liste pacijentkinja...'));

    const lekarId = localStorage.getItem('userId');
    if (!lekarId) {
        clearElement(mainContent);
        mainContent.appendChild(createTextElement('p', 'Greška: ID lekara nije pronađen.', 'text-red-500'));
        return;
    }
    
    try {
        const porodiljeData = await fetchPorodilje(lekarId);
        clearElement(mainContent);

        const header = document.createElement('header');
        header.className = 'mb-8';
        header.appendChild(createTextElement('h2', 'Lista pacijentkinja', 'text-4xl font-bold text-gray-800'));
        mainContent.appendChild(header);

        const porodiljeContainer = document.createElement('div');
        porodiljeContainer.className = 'bg-white p-6 rounded-2xl shadow-lg';
        const porodiljeList = document.createElement('ul');
        porodiljeList.className = 'space-y-4';
        
        const aktivnePorodilje = porodiljeData.filter(leci => leci.porodilja && !leci.porodilja.sePorodila);
        
        if (aktivnePorodilje.length > 0) {
            aktivnePorodilje.forEach(porodilja => {
                porodiljeList.appendChild(createPorodiljaListItem(porodilja, mainContent));
            });
        } else {
            porodiljeList.appendChild(createTextElement('p', 'Trenutno nemate aktivnih pacijentkinja.', 'text-gray-500'));
        }

        porodiljeContainer.appendChild(porodiljeList);
        mainContent.appendChild(porodiljeContainer);
    } catch (error) {
        console.error("Greška u renderListaPacijentkinja:", error);
        clearElement(mainContent);
        mainContent.appendChild(createTextElement('p', 'Došlo je do greške pri učitavanju pacijentkinja.', 'text-red-500'));
    }
}