import { QuickAddEntry } from '../types/QuickAddEntry';

export class PreviewFormatter {
    /**
     * Format a list of QuickAdd entries into a readable string
     * for displaying in Discord preview messages.
     */
    static formatEntries(entries: QuickAddEntry[]): string {
        if (!entries.length) return 'No entries to display.';
        return entries.map(entry => {
            const status = entry.status !== 'OK' ? `[${entry.status}] ` : '';
            const value = entry.value ?? '???';
            return `${status}${entry.nickname} – ${value}`;
        }).join('\n');
    }
}