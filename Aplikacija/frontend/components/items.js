export const createAppointmentItem = (data, isPending = false) => {
    const item = document.createElement('div');
    item.className = `p-4 rounded-xl flex justify-between items-center ${isPending ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'bg-pink-50 border-l-4 border-pink-400'}`;
    
    const termin = data.termin; 
    const tipPregleda = data.tipPregleda || data.tip;

    const lekarIme = data.lekar || 'Nepoznato'; 
    const statusText = isPending ? 'Čeka potvrdu' : `Doktor: ${lekarIme}`;

    item.innerHTML = `
        <div>
            <p class="text-lg font-semibold text-gray-800">${tipPregleda}</p>
            <p class="text-sm text-gray-600">${termin}</p>
            <p class="text-xs text-gray-500 mt-1">${statusText}</p>
        </div>
        ${isPending ? '<span class="text-xs text-yellow-600 font-medium">Na čekanju</span>' : '<i class="fas fa-check-circle text-pink-500 text-xl"></i>'}
    `;
    return item;
};