import { searchUserByJMBG } from '../services/authService.js';
import DashboardPosetilac from './dashboardPosetilac.js';

function createInputField(id, label, type = 'text', required = true, maxLength = null) {
    const div = document.createElement('div');
    div.className = 'mb-4 text-left';

    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.className = 'block text-gray-700 text-sm font-bold mb-2';
    labelEl.textContent = label;

    const inputEl = document.createElement('input');
    inputEl.type = type;
    inputEl.id = id;
    inputEl.name = id;
    inputEl.inputMode = 'numeric'; 
    inputEl.pattern = '[0-9]*'; 
    inputEl.className = 'shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-300';
    inputEl.required = required;
    
    if (maxLength) {
        inputEl.maxLength = maxLength;
    }

    inputEl.oninput = function() {
        this.value = this.value.replace(/[^0-9]/g, ''); 
    };

    div.appendChild(labelEl);
    div.appendChild(inputEl);
    return div;
}

export default function SearchPage({ renderPage }) {
    const container = document.createElement('div');
    container.className = 'min-h-screen bg-gradient-to-br from-pink-200 to-blue-200 flex items-center justify-center p-4 flex-col gap-6'; 

    const card = document.createElement('div');
    card.className = 'bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full';

    const title = document.createElement('h2');
    title.className = 'text-3xl font-bold text-pink-400 mb-6 text-center';
    title.textContent = 'Pretraga';
    
    const form = document.createElement('form');
    form.className = 'space-y-6'; 

    const jmbgInput = createInputField('jmbg', 'JMBG (13 karaktera)', 'text', true, 13);
    form.appendChild(jmbgInput);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'w-full bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md';
    submitBtn.textContent = 'Pretraga';
    form.appendChild(submitBtn);

    const backBtn = document.createElement('button');
    backBtn.type = 'button'; 
    backBtn.className = 'w-full bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md max-w-md mx-auto mt-4'; 
    backBtn.textContent = 'Nazad na početnu stranu';

    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const jmbgInputEl = document.getElementById('jmbg');
        const jmbg = jmbgInputEl ? jmbgInputEl.value : null;
        
        if (!jmbg || jmbg.length !== 13 || isNaN(jmbg)) {
            alert("Molimo unesite validan JMBG broj sa tačno 13 cifara.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Pretražujem...';

        const result = await searchUserByJMBG(jmbg); 
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Pretraga';

        if (result && result.id) {
            localStorage.setItem('userId', result.id);
            renderPage(DashboardPosetilac);
            return;
        }
        alert('Nije pronađen korisnik sa unetim JMBG-om.');
    };
    
    card.appendChild(title);
    card.appendChild(form);
    card.appendChild(backBtn);
    
    
    container.appendChild(card);
    return container;
}