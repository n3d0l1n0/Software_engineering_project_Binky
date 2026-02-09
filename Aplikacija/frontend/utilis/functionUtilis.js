
export function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }}

export function createTextElement(tag, text, className = '') {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) {
        element.className = className;
    }
    return element;
}