import { loginUser} from '../services/authService.js'; 
import porodilja from './dashboardPorodilja.js';
import DoktorDashboard from './dashboardDoktor.js';

function createInputField(id, label, type = 'text', required = true) {
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
    inputEl.className = 'shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-300';
    inputEl.required = required;

    div.appendChild(labelEl);
    div.appendChild(inputEl);
    return div;
}

function createRadioButton(name, value, labelText, isChecked = false) {
    const div = document.createElement('div');
    div.className = 'flex items-center';

    const input = document.createElement('input');
    input.type = 'radio';
    input.id = value;
    input.name = name;
    input.value = value;
    input.className = 'h-4 w-4 text-pink-500 border-gray-300 focus:ring-pink-400';
    if (isChecked) {
        input.checked = true;
    }

    const label = document.createElement('label');
    label.htmlFor = value;
    label.className = 'ml-2 block text-sm font-medium text-gray-700';
    label.textContent = labelText;

    div.appendChild(input);
    div.appendChild(label);
    return div;
}

export default function LoginPage({ renderPage }) {
    const container = document.createElement('div');
    container.className = 'min-h-screen bg-gradient-to-br from-pink-200 to-blue-200 flex items-center justify-center p-4';

    const card = document.createElement('div');
    card.className = 'bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full';

    const title = document.createElement('h2');
    title.className = 'text-3xl font-bold text-pink-400 mb-6 text-center';
    title.textContent = 'Prijava';

    const radioContainer = document.createElement('div');
    radioContainer.className = 'flex justify-center space-x-6 mb-6';
    
    const radioDoktor = createRadioButton('userType', 'lekar', 'Doktor');
    const radioPorodilja = createRadioButton('userType', 'porodilja', 'Porodilja', true);
    radioContainer.appendChild(radioDoktor);
    radioContainer.appendChild(radioPorodilja);

    const form = document.createElement('form');
    form.className = 'space-y-4';
    
    form.appendChild(radioContainer);

    form.appendChild(createInputField('email', 'Email', 'email'));
    form.appendChild(createInputField('password', 'Lozinka', 'password'));

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className='w-full bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md mb-4 mt-6';
    submitBtn.classList.add('PrijavaButton');
    submitBtn.textContent = 'Prijavi se';
    form.appendChild(submitBtn);

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'w-full bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md max-w-md mx-auto mt-4';
    backBtn.textContent = "Nazad na početnu stranu";
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        submitBtn.disabled = true;

        const formData = new FormData(form);
        const credentials = Object.fromEntries(formData.entries());
        
        const email = credentials.email;
        const lozinka = credentials.password;
        const userType = credentials.userType;

        console.log(`Pokušaj prijave sa emailom: ${email}, tip korisnika: ${userType}`);
        const result = await loginUser(email, lozinka, userType);

        
            console.log(`${localStorage.getItem('token')}`);
            console.log(`${localStorage.getItem('userId')}`);

        submitBtn.disabled = false;
        submitBtn.textContent = 'Prijavi se';
        

        if (result.success) {
            if (userType === 'porodilja') {
                renderPage(porodilja, true); 
            } else if (userType === 'lekar') {
                renderPage(DoktorDashboard, true); 
            }
        } else {
            alert(`Greška: ${result.error || result.message}`);
        }
    };
    card.appendChild(title);
    card.appendChild(form);
    card.appendChild(backBtn);
    container.appendChild(card);
    return container;
}