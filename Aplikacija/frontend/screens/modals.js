export function createLekarSelectionModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'lekar-selection-modal';
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50';

    const modalContent = document.createElement('div');
    modalContent.className = `
        bg-white rounded-2xl shadow-2xl 
        p-6 sm:p-8 
        w-full max-w-md 
        transform transition-all 
        overflow-y-auto max-h-[90vh]
        text-base
        `;

    const headerDiv = document.createElement('div');
    headerDiv.className = 'flex justify-between items-center mb-4';
    const title = document.createElement('h3');
    title.className = 'text-xl font-bold text-gray-800';
    title.textContent = 'Izaberite svog lekara';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'text-gray-500 hover:text-gray-800 text-2xl close-lekar-modal';
    closeBtn.innerHTML = '&times;'; 
    headerDiv.appendChild(title);
    headerDiv.appendChild(closeBtn);

    const lekariList = document.createElement('div');
    lekariList.id = 'lekari-list';
    lekariList.className = 'space-y-3 max-h-96 overflow-y-auto pr-2';
    lekariList.innerHTML = '<p class="text-gray-500 text-center py-4">Učitavanje lekara...</p>';

    modalContent.appendChild(headerDiv);
    modalContent.appendChild(lekariList);
    modalOverlay.appendChild(modalContent);

    const closeModal = () => modalOverlay.classList.add('hidden');
    closeBtn.onclick = closeModal;
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    };
    
    return modalOverlay;
}
export function createSchedulingModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'scheduling-modal';
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50';

    const modalContent = document.createElement('div');
    modalContent.className = `
        bg-white rounded-2xl shadow-2xl 
        p-6 sm:p-8 
        w-full max-w-md 
        transform transition-all 
        overflow-y-auto max-h-[90vh]
        text-base
    `;

    const headerDiv = document.createElement('div');
    headerDiv.className = 'flex justify-between items-center mb-6';
    const title = document.createElement('h3');
    title.className = 'text-2xl font-bold text-gray-800';
    title.textContent = 'Zakaži pregled';
    const closeBtn = document.createElement('button');
    closeBtn.id = 'close-modal-btn';
    closeBtn.className = 'text-gray-500 hover:text-gray-800 text-2xl';
    closeBtn.innerHTML = '&times;'; 
    headerDiv.appendChild(title);
    headerDiv.appendChild(closeBtn);

    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'space-y-4';

    const typeDiv = document.createElement('div');
    const typeLabel = document.createElement('label');
    typeLabel.htmlFor = 'pregled-type';
    typeLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    typeLabel.textContent = 'Tip pregleda';
    const typeSelect = document.createElement('select');
    typeSelect.id = 'pregled-type';
    typeSelect.className = 'w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Izaberite tip pregleda...';
    typeSelect.appendChild(defaultOption);
    typeDiv.appendChild(typeLabel);
    typeDiv.appendChild(typeSelect);

    const dateDiv = document.createElement('div');
    const dateLabel = document.createElement('label');
    dateLabel.htmlFor = 'pregled-date';
    dateLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    dateLabel.textContent = 'Datum';
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.id = 'pregled-date';
    dateInput.className = 'w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300';
    dateInput.min = new Date().toISOString().split('T')[0];

    dateDiv.appendChild(dateLabel);
    dateDiv.appendChild(dateInput);

    const terminiContainer = document.createElement('div');
    terminiContainer.id = 'termini-container';
    terminiContainer.className = 'hidden';
    const terminiLabel = document.createElement('p');
    terminiLabel.className = 'block text-sm font-medium text-gray-700 mb-2';
    terminiLabel.textContent = 'Slobodni termini:';
    const terminiGrid = document.createElement('div');
    terminiGrid.id = 'termini-grid';
    terminiGrid.className = `
        grid 
        grid-cols-[repeat(auto-fit,minmax(120px,1fr))] 
        gap-2 
        max-h-80 
        overflow-y-auto  
        `;
    terminiContainer.appendChild(terminiLabel);
    terminiContainer.appendChild(terminiGrid);
    
    const loaderDiv = document.createElement('div');
    loaderDiv.id = 'termini-loader';
    loaderDiv.className = 'text-center hidden p-4';
    const loaderText = document.createElement('p');
    loaderText.textContent = 'Učitavanje termina...';
    loaderDiv.appendChild(loaderText);

    fieldsContainer.appendChild(typeDiv);
    fieldsContainer.appendChild(dateDiv);
    fieldsContainer.appendChild(terminiContainer);
    fieldsContainer.appendChild(loaderDiv);

    const submitBtn = document.createElement('button');
    submitBtn.id = 'zakazi-termin-btn';
    submitBtn.className = 'w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md mt-6';
    submitBtn.textContent = 'Zakaži termin';
    submitBtn.disabled = true;

    modalContent.appendChild(headerDiv);
    modalContent.appendChild(fieldsContainer);
    modalContent.appendChild(submitBtn);
    modalOverlay.appendChild(modalContent);

    closeBtn.onclick = () => modalOverlay.classList.add('hidden');
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.add('hidden');
        }
    };
    
    return modalOverlay;
}