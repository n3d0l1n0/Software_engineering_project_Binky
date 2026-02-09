export function createNavItem(iconClass, text, isActive = false) {
    const item = document.createElement('a');
    item.href = '#';
    let className = 'flex items-center p-3 rounded-xl transition duration-200 text-gray-700';
    if (isActive) {
        className += ' bg-pink-100 font-semibold text-pink-600 shadow-md';
    } else {
        className += ' hover:bg-pink-50 hover:text-pink-500';
    }
    item.className = className;
    const icon = document.createElement('i');
    icon.className = `${iconClass} mr-4 text-xl`;
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    item.appendChild(icon);
    item.appendChild(textSpan);
    return item;
}