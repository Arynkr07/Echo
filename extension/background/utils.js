// ============================================================
// Echo Extension — Background Utils
// Shared helpers used by the background service worker
// ============================================================

/**
 * Generate a short, unique meeting ID.
 * Format: echo-<timestamp>-<random4hex>
 * Example: echo-1727123456789-a3f2
 */
export function generateMeetingId() {
    const ts  = Date.now();
    const rnd = Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0');
    return `echo-${ts}-${rnd}`;
}

/**
 * Format a Date (or ISO string) as HH:MM:SS
 */
export function formatTimestamp(date) {
    const d = (date instanceof Date) ? date : new Date(date);
    return d.toTimeString().slice(0, 8);  // "HH:MM:SS"
}
