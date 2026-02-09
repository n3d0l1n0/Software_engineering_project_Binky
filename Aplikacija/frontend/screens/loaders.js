import {getVazecePreporukeZaPorodilju} from '../services/preporukaService.js'
import { getProsliPregledi } from '../services/preglediService.js';
import {getRezultatiZaPorodilju} from '../services/preglediService.js'


export const loadPreporuke = async (porodiljaId, container) => {
    container.innerHTML = '<p class="text-gray-500 text-center py-8">Učitavanje preporuka...</p>';
    try {
        const preporuke = await getVazecePreporukeZaPorodilju(porodiljaId);
        console.log(preporuke);
        
        container.textContent = '';
        if (preporuke && preporuke.length > 0) {
            const list = document.createElement('div');
            list.className = 'space-y-4';
            
            preporuke.forEach(p => {
                const item = document.createElement('div');
                item.className = 'p-4 bg-pink-50 rounded-xl shadow-sm border-l-4 border-pink-400';
                const formattedDate = new Date(p.datumIsteka).toLocaleDateString('sr-RS');

                item.innerHTML = `
                    <p class="font-semibold text-gray-800">Preporuka</p> 
                    <p class="text-sm text-gray-600 mt-1">${p.tekst}</p>
                    <p class="text-xs text-gray-400 mt-2">Važi do: ${formattedDate || 'Nije definisan'}</p>
                `;
                list.appendChild(item);
            });
            container.appendChild(list);
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">Trenutno nema važećih preporuka od vašeg lekara.</p>';
        }
    } catch (error) {
        console.error("Greška pri dohvatanju preporuka u Dashboardu:", error);
        container.innerHTML = '<p class="text-red-500 text-center py-8">Greška pri učitavanju preporuka.</p>';
    }
};
export const loadPreviousAppointments = async (porodiljaId, container) => {
    container.innerHTML = '<p class="text-gray-500 text-center py-4">Učitavanje prethodnih pregleda...</p>';
    
    try {
        const response = await getProsliPregledi(porodiljaId); 
        const previousAppointments = Array.isArray(response) ? response : [];
        console.log("Dohvaćeni i pripremljeni pregledi:", previousAppointments);
        
        container.textContent = ''; 

        if (previousAppointments.length > 0) {
            previousAppointments.sort((a, b) => new Date(b.termin) - new Date(a.termin));

            previousAppointments.forEach(app => {
                const appointmentDiv = document.createElement('div');
                appointmentDiv.className = 'p-4 mb-3 border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition duration-150';
                const terminDatum = app.termin ? new Date(app.termin) : null;
                
                let datumStr = 'Nije zabeležen datum';
                let vremeStr = '';

                if (terminDatum && !isNaN(terminDatum)) {
                    const dan = String(terminDatum.getDate()).padStart(2, '0');
                    const mesec = String(terminDatum.getMonth() + 1).padStart(2, '0');
                    const godina = terminDatum.getFullYear();
                    datumStr = `${dan}.${mesec}.${godina}.`;

                    const sati = String(terminDatum.getHours()).padStart(2, '0');
                    const minuti = String(terminDatum.getMinutes()).padStart(2, '0');
                    vremeStr = `${sati}:${minuti}`;
                }
                
                appointmentDiv.innerHTML = `
                    <div class="flex justify-between items-start border-b border-gray-100 pb-2">
                        <div class="text-sm font-semibold text-gray-700">
                            ${datumStr} ${vremeStr ? `u ${vremeStr}` : ''}
                        </div>
                        <span class="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Završen</span>
                        <input type="checkbox" class="w-5 h-5 accent-pink-500 cursor-pointer"data-id="${app.pregledId}"${app.dozvoljenoPrikazivanje ? 'checked' : ''}>
                        </div>

                    </div>
                    
                    <div class="mt-2 text-base font-extrabold text-indigo-800">
                        ${app.tipPregleda || 'Tip pregleda nije naveden'}
                    </div>

                    <div class="mt-1 text-sm text-gray-600">
                        ${app.lekar ? `<span class="font-medium">Lekar:</span> ${app.lekar}` : 'Lekar nije naveden'}
                    </div>
                `;

                container.appendChild(appointmentDiv);
                const checkbox = appointmentDiv.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', async (e) => {
                    try {
                    const updatedPregled = {
                        id: app.pregledId,
                        termin: app.termin,
                        idLeci: app.idLeci || 0,
                        idTipaPregleda: app.idTipaPregleda || 0,
                        jePotvrdjen: true,                     
                        dozvoljenoPrikazivanje: e.target.checked 
                    };

                    await updatePregled(app.pregledId, e.target.checked);
                    console.log(`Pregled ${app.pregledId} uspešno ažuriran.`);
                    } catch (err) {
                    console.error('Greška pri ažuriranju pregleda:', err);
                    e.target.checked = !e.target.checked;
                    }
                });
            });
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Nema zabeleženih prethodnih pregleda.</p>';
        }

    } catch (error) {
        console.error("Greška pri dohvatanju prethodnih pregleda:", error);
        container.innerHTML = '<p class="text-red-500 text-center py-4">Greška pri učitavanju liste prethodnih pregleda.</p>';
    }
};
export const loadRezultati = async (porodiljaId, container) => {
    if (!(container instanceof HTMLElement)) {
        console.error("Kontejner mora biti validan DOM element (HTMLElement).");
        return;
    }

    container.innerHTML = '<p class="text-gray-500 text-center py-4">Učitavanje prethodnih rezultata...</p>';
    
    try {
        const previousAppointments = await getRezultatiZaPorodilju(porodiljaId); 
        container.innerHTML = ''; 

        if (Array.isArray(previousAppointments) && previousAppointments.length > 0) {
            
            previousAppointments.sort((a, b) => new Date(b.originalTermin) - new Date(a.originalTermin));

            previousAppointments.forEach(data => {
                
                const tipPregleda = data.tipPregleda || data.tip || 'Pregled'; 
                const link = data.sadrzaj;
                const datumStr = data.datum || data.termin;
                let termin = 'Nema termina';

                if (datumStr) {
                    const delovi = datumStr.split('T');
                    if (delovi.length > 0) {
                        termin = delovi[0];
                    } else {
                        termin = datumStr;
                    }
                }
                                
                const item = document.createElement('div');
                item.className = 'p-4 rounded-xl flex justify-between items-center bg-pink-50 border-l-4 border-pink-400';
                const linkHTML = link 
                    ? `<a href="${link}" target="_blank" class="text-blue-600 hover:text-blue-800 underline text-xs mt-1 block">Detalji rezultata</a>` 
                    : '<span class="text-xs text-gray-500 mt-1 block">Nema linka</span>';
                
                item.innerHTML = `
                    <div>
                        <p class="text-lg font-semibold text-gray-800">${tipPregleda}</p>
                        <p class="text-sm text-gray-600">${termin}</p>
                        <p class="text-xs text-gray-500 mt-1">${linkHTML}</p>
                    </div>
                    <i class="fas fa-check-circle text-pink-500 text-xl"></i>
                `;

                container.appendChild(item);
            });
            
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Nema zabeleženih rezultata.</p>';
        }

    } catch (error) {
        console.error("Greška pri dohvatanju rezultata:", error);
        container.innerHTML = '<p class="text-red-500 text-center py-4">Greška pri učitavanju liste rezultata</p>';
    }
};
export const updatePregled = (id, dozvoljenoPrikazivanje) => {
const url = `http://localhost:5278/pregled/Pregled/pregled/${id}/dozvoljenoPrikazivanje`;
    
    return axios.patch(url, null, {
        params: {
            DozvoljenoPrikazivanje: dozvoljenoPrikazivanje 
        }
});};