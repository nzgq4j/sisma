// Felt reports are accepted for quakes up to 6 hours old (shared by the UI and POST /api/reports).
export const REPORT_WINDOW_MS = 6 * 3600_000;
/** Extra time the server allows so a form opened just before the cutoff can still be sent. */
export const REPORT_GRACE_MS = 30 * 60_000;

export const canReport = (quakeTime: number, now: number) => now >= quakeTime && now - quakeTime <= REPORT_WINDOW_MS;
