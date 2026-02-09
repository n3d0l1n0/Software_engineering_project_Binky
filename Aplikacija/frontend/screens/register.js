import { registerUser, updateProfilePicture } from "../services/authService.js";
import { uploadProfilePicture } from "../services/storageService.js";

function createInputField(id, label, type = 'text', required = true, maxLength = null, numericOnly = false, minLength = null) {
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
    
    if (maxLength) {
        inputEl.maxLength = maxLength;
    }

    if (minLength) {
        inputEl.minLength = minLength;
    }

    const errorEl = document.createElement('span');
    errorEl.id = `${id}-error`;
    errorEl.className = 'text-red-500 text-xs mt-1 hidden'; 

    if (type === 'date') {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const maxDate = now.toISOString().slice(0, 10);
        inputEl.max = maxDate;
    }

    if (numericOnly) {
        inputEl.pattern = '[0-9]*';
        inputEl.inputMode = 'numeric';    
        
        const originalOnInput = inputEl.oninput;
        inputEl.oninput = (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            if (originalOnInput) originalOnInput(e); 
        };
    }
    else if(id === 'ImeIPrezime') {
        inputEl.oninput = (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-Z\sčćžđšČĆŽŠĐĆ'-]/g, '');
        };
    }
    
    if (minLength && minLength === maxLength) {
        inputEl.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value.length > 0 && value.length < minLength) {
                errorEl.textContent = `Polje mora imati tačno ${minLength} karaktera.`;
                errorEl.classList.remove('hidden');
            } else {
                errorEl.classList.add('hidden');
            }
        });
    }

    if (type === 'file') {
        inputEl.accept = 'image/*';
        inputEl.required = false; 
    }

    div.appendChild(labelEl);
    div.appendChild(inputEl);
    div.appendChild(errorEl); 
    return div;
}

export default function RegisterPage() {
    const container = document.createElement('div');
    container.className = 'min-h-screen bg-gradient-to-br from-pink-200 to-blue-200 flex items-center justify-center p-4';

    const card = document.createElement('div');
    card.className = 'bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-lg w-full';

    const title = document.createElement('h2');
    title.className = 'text-3xl font-bold text-pink-400 mb-6 text-center';
    title.textContent = 'Registracija';

    const messageDisplay = document.createElement('div');
    messageDisplay.className = 'p-3 rounded-lg text-center mb-4 hidden';
    card.appendChild(messageDisplay);

    const form = document.createElement('form');
    form.className = 'space-y-4';
    form.setAttribute('novalidate', ''); 

    const fields = document.createElement('div');
    
    fields.appendChild(createInputField('ImeIPrezime', 'Ime i prezime', 'text'));
    fields.appendChild(createInputField('DatumRodjenja', 'Datum rođenja', 'date'));
    fields.appendChild(createInputField('Telefon', 'Broj telefona', 'tel', true, null, true));
    
    fields.appendChild(createInputField('JMBG', 'JMBG', 'text', true, 13, true, 13));
    fields.appendChild(createInputField('LBO', 'LBO', 'text', true, 11, true, 11));
    
    fields.appendChild(createInputField('Email', 'Email', 'email'));
    fields.appendChild(createInputField('Lozinka', 'Lozinka', 'password'));
    fields.appendChild(createInputField('ProfilnaSlika', 'Profilna slika', 'file', false));
    fields.appendChild(createInputField('PocetakTrudnoce', 'Pocetak trudnoće', 'date'));

    form.appendChild(fields);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'w-full bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md mb-4 mt-6';
    submitBtn.textContent = 'Registruj se';
    form.appendChild(submitBtn);

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'w-full bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md max-w-md mx-auto mt-4';
    backBtn.textContent = 'Nazad na početnu stranu';

    function showMessage(message, isSuccess) {
        messageDisplay.textContent = message;
        messageDisplay.className = isSuccess
            ? 'p-3 rounded-lg text-center mb-4 block bg-green-100 text-green-700 font-medium'
            : 'p-3 rounded-lg text-center mb-4 block bg-red-100 text-red-700 font-medium';
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        
        submitBtn.disabled = true;
        messageDisplay.classList.add('hidden');

        const formData = new FormData(form);
        const credentials = Object.fromEntries(formData.entries());

        if (credentials.JMBG.length !== 13) {
            showMessage('JMBG mora imati tačno 13 cifara.', false);
            submitBtn.disabled = false;
            return;
        }
        if (credentials.LBO.length !== 11) {
            showMessage('LBO mora imati tačno 11 cifara.', false);
            submitBtn.disabled = false;
            return;
        }
        
        const profileImageFile = formData.get('ProfilnaSlika');

        const finalData = { ...credentials };
        delete finalData.ProfilnaSlika;

        if (finalData.DatumRodjenja) {
            finalData.DatumRodjenja = finalData.DatumRodjenja + 'T00:00:00.000Z';
        }
        if (finalData.PocetakTrudnoce) {
            finalData.PocetakTrudnoce = finalData.PocetakTrudnoce + 'T00:00:00.000Z';
        }
        let result = await registerUser(finalData); 

        submitBtn.disabled = false;
        
        if (result.success) {
            const userId = result.data?.userId;
            let successMessage = result.message || "Registracija uspešna!";
            console.log("Korisnik registrovan sa ID-jem:", userId);
            if(profileImageFile instanceof File && profileImageFile.size > 0 && userId) {
                console.log("krece upload slike");
                const uploadResult = await uploadProfilePicture(userId, profileImageFile);
                if (uploadResult.success) {
                    const pictureUrl = uploadResult.publicUrl;
                    const updateResult = await updateProfilePicture(userId, pictureUrl);
                    
                    if (!updateResult.success) {
                        showMessage(`Uspeli ste da se registrujete, ali slika profila nije sačuvana u bazi. Razlog: ${updateResult.message}`, false);
                        submitBtn.disabled = false;
                        return;
                    }
                    successMessage = "Registracija uspešna i profilna slika sačuvana!";
                } else {
                    showMessage(`Uspeli ste da se registrujete, ali upload slike nije uspeo. Razlog: ${uploadResult.message}`, false);
                    submitBtn.disabled = false;
                    return;
                }
            } 

            showMessage(successMessage, true);
            window.location.href = '#/login';
        } else {
            showMessage(`Greška prilikom registracije: ${result.message}`, false);
        }
        submitBtn.disabled = false;
    };

    card.appendChild(title);
    card.appendChild(form);
    card.appendChild(backBtn);

    container.appendChild(card);
    container.backBtn = backBtn; 

    return container;
}