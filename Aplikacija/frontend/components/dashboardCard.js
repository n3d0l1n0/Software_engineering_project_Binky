export function createDashboardCard(title, value, iconClass, color) {
    const card = document.createElement('div');
    card.className = `bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between transition duration-300 ease-in-out transform hover:scale-[1.02] border-t-4 ${color.border}`;
    const info = document.createElement('div');
    const titleEl = document.createElement('p');
    titleEl.className = 'text-sm font-medium text-gray-500 mb-1';
    titleEl.textContent = title;
    const valueEl = document.createElement('p');
    valueEl.className = 'text-3xl font-bold text-gray-800';
    valueEl.textContent = value;
    info.appendChild(titleEl);
    info.appendChild(valueEl);
    const iconBox = document.createElement('div');
    iconBox.className = `p-3 rounded-full ${color.bg} ${color.text}`;
    const icon = document.createElement('i');
    icon.className = `${iconClass} text-2xl`;
    iconBox.appendChild(icon);
    card.appendChild(info);
    card.appendChild(iconBox);
    return card;
}
