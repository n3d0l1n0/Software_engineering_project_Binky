export function formatUTCToCET(utcDateString) {
    if (!utcDateString) return 'N/A';
    const date = new Date(utcDateString);
    return date.toLocaleString('sr-RS', {
        timeZone: 'Europe/Belgrade',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatLocalToUTC(localDate) {
    if (!localDate) return null;
    return new Date(localDate).toISOString();
}

export function formatTimeToCET(utcDateString) {
    if (!utcDateString) return 'N/A';
    const date = new Date(utcDateString);
    return date.toLocaleTimeString('sr-RS', {
        timeZone: 'Europe/Belgrade',
        hour: '2-digit',
        minute: '2-digit'
    });
}