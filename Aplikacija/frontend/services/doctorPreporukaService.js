import { getPreporukeZaLekara, getSvePreporuke, createPreporuka, updatePreporuka, deletePreporuka, getPreporukaById } from './preporukaService.js';
import { fetchPorodilje } from './doctorPorodiljaService.js'; 
import {createTextElement, clearElement} from '../utilis/functionUtilis.js';

function formatLocalToUTC(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
}

function createPreporukaListItem(preporuka, lekarId, refreshCallback) {
    const item = document.createElement('div');
    item.className = 'p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3';    
    const info = document.createElement('div');
    const imePrezime = preporuka.imeIPrezime || 'Nepoznata pacijentkinja';
    const datumiText = `Važi od ${new Date(preporuka.datumOd).toLocaleDateString('sr-RS')} do ${new Date(preporuka.datumDo).toLocaleDateString('sr-RS')}`;
    
    info.append(
        createTextElement('p', imePrezime, 'font-bold text-gray-800'),
        createTextElement('p', preporuka.tekst, 'text-sm text-gray-600 mt-1 break-words'),
        createTextElement('p', datumiText, 'text-xs text-gray-500 mt-2')
    );

    const actions = document.createElement('div');
    actions.className = 'flex space-x-2 self-end sm:self-center flex-shrink-0';
    const editBtn = createTextElement('button', 'Izmeni', 'px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm');
    editBtn.onclick = async () => {
        try {
            const punaPreporuka = await getPreporukaById(preporuka.id);
            showPreporukaForm(punaPreporuka, lekarId, refreshCallback);
        } catch (error) {
            console.error('Greška pri učitavanju podataka za izmenu:', error);
            alert('Došlo je do greške pri učitavanju podataka za izmenu.');
        }
    };    
    const deleteBtn = createTextElement('button', 'Obriši', 'px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm');
    deleteBtn.onclick = async () => {
        if (confirm('Da li ste sigurni da želite da obrišete ovu preporuku?')) {
            try {
                await deletePreporuka(preporuka.id);
                alert('Preporuka je uspešno obrisana.');
                refreshCallback();
            } catch (error) {
                console.error('Greška pri brisanju preporuke:', error);
                alert('Došlo je do greške pri brisanju preporuke.');
            }
        }
    };
    
    actions.append(editBtn, deleteBtn);
    item.append(info, actions);
    return item;
}

async function showPreporukaForm(preporuka, lekarId, callback) {
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const dialog = document.createElement('div');
    dialog.className = 'bg-white p-6 rounded-lg shadow-xl w-full max-w-lg';
    dialog.addEventListener('click', e => e.stopPropagation());
    
    const form = document.createElement('form');
    form.id = 'preporukaForm';

    const selectPacijentkinja = document.createElement('select');
    selectPacijentkinja.id = 'leciId';
    selectPacijentkinja.name = 'leciId';
    selectPacijentkinja.className = 'mt-1 block w-full p-2 border border-gray-300 rounded-md';
    selectPacijentkinja.required = true;

    try {
        const lecenja = await fetchPorodilje(lekarId);
        if (lecenja.length > 0) {
            lecenja.forEach(leci => {
                if (leci?.porodilja) selectPacijentkinja.add(new Option(leci.porodilja.imeIPrezime, leci.id));
            });
        } else {
            selectPacijentkinja.disabled = true;
            selectPacijentkinja.add(new Option('Nema dostupnih pacijentkinja', ''));
        }
    } catch (error) {
        alert("Greška pri učitavanju liste pacijentkinja.");
        return;
    }

    const textAreaPreporuka = Object.assign(document.createElement('textarea'), {
        id: 'tekst', name: 'tekst', rows: 4, required: true,
        className: 'mt-1 block w-full p-2 border border-gray-300 rounded-md',
        value: preporuka?.tekst || ''
    });

    const createDateField = (id, label, value) => {
        const div = document.createElement('div');
        div.appendChild(createTextElement('label', label, 'block text-sm font-medium text-gray-700 mb-1'));
        const input = Object.assign(document.createElement('input'), {
            type: 'date', id, name: id, required: true,
            className: 'mt-1 block w-full p-2 border border-gray-300 rounded-md'
        });
        if (value) input.value = value.split('T')[0];
        div.appendChild(input);
        return div;
    };
    
    const datumiGrid = document.createElement('div');
    datumiGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6';
    datumiGrid.append(
        createDateField('datumOd', 'Datum od', preporuka?.datumOd),
        createDateField('datumDo', 'Datum do', preporuka?.datumDo)
    );

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'flex justify-end space-x-3';
    const cancelBtn = createTextElement('button', 'Odustani', 'px-4 py-2 bg-gray-200 rounded-lg');
    const submitBtn = createTextElement('button', 'Sačuvaj', 'px-4 py-2 bg-pink-500 text-white rounded-lg');
    cancelBtn.type = 'button';
    submitBtn.type = 'submit';
    buttonsDiv.append(cancelBtn, submitBtn);

    form.append(
        createTextElement('h3', preporuka ? 'Izmena preporuke' : 'Dodavanje preporuke', 'text-2xl font-bold mb-5'),
        createTextElement('label', 'Pacijentkinja', 'block text-sm font-medium text-gray-700 mb-1'), selectPacijentkinja,
        createTextElement('label', 'Tekst preporuke', 'block text-sm font-medium text-gray-700 mt-4 mb-1'), textAreaPreporuka,
        datumiGrid, buttonsDiv
    );

    dialog.appendChild(form);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
    
    const closeDialog = () => backdrop.remove();
    cancelBtn.onclick = closeDialog;
    backdrop.addEventListener('click', closeDialog);
    
    if (preporuka && preporuka.idLeci) {
        selectPacijentkinja.value = preporuka.idLeci;
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Čuvanje...';
        
        const dataToSend = {
            idLeci: parseInt(form.leciId.value),
            tekst: form.tekst.value,
            datumOd: formatLocalToUTC(form.datumOd.value),
            datumDo: formatLocalToUTC(form.datumDo.value),
        };

        try {
            if (preporuka) {
                await updatePreporuka(preporuka.id, { ...dataToSend, id: preporuka.id });
                alert('Preporuka je uspešno izmenjena.');
            } else {
                await createPreporuka(dataToSend);
                alert('Preporuka je uspešno dodata.');
            }
            closeDialog();
            callback();
        } catch (error) {
            console.error('Greška pri čuvanju preporuke:', error);
            alert('Došlo je do greške. Proverite konzolu za detalje.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sačuvaj';
        }
    };
}

export async function renderPreporuke(mainContent) {
    clearElement(mainContent);

    const lekarId = localStorage.getItem('userId');

    const header = document.createElement('header');
    header.className = 'mb-6';
    const title = createTextElement('h2', 'Upravljanje preporukama', 'text-3xl font-bold text-gray-800');
    header.appendChild(title);
    mainContent.appendChild(header);

    const container = document.createElement('div');
    container.className = 'bg-white p-6 rounded-2xl shadow-lg flex flex-col h-[calc(100vh-120px)]'; 
    mainContent.appendChild(container);
    
    const loadPreporuke = () => {
        renderPreporuke(mainContent);
    };

    const addPreporukaBtn = createTextElement('button', 'Dodaj novu preporuku', 'mb-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 self-start'); 
    addPreporukaBtn.onclick = () => showPreporukaForm(null, lekarId, loadPreporuke);
    
    const preporukeList = document.createElement('div');
    preporukeList.textContent = 'Učitavanje preporuka...';
    preporukeList.className = 'flex-grow overflow-y-auto pr-2 space-y-3';
    container.append(addPreporukaBtn, preporukeList);

    try {
        const responseData = await getPreporukeZaLekara(lekarId);
        console.log("Odgovor dobijen sa servera:", responseData);

        const preporuke = responseData?.$values || [];

        clearElement(preporukeList);
        if (preporuke.length > 0) {
            preporuke.forEach(p => {
                const preporukaItem = createPreporukaListItem(p, lekarId, loadPreporuke);
                preporukeList.appendChild(preporukaItem);
            });
        } else {
            preporukeList.appendChild(createTextElement('p', 'Nema kreiranih preporuka za vaše pacijentkinje.', 'text-gray-500'));
        }
    } catch (error) {
        console.error("Greška pri učitavanju preporuka:", error);
        clearElement(preporukeList);
        preporukeList.appendChild(createTextElement('p', 'Greška pri učitavanju preporuka.', 'text-red-500'));
    }
}