export function isReminderTime(value: unknown): value is string {
 return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
export function reminderTimeOrDefault(value: unknown): string {
 return isReminderTime(value) ? value : '09:00';
}
export function reminderMessage(enabled:boolean,platform:string):string {
 if(enabled) return 'Local reminders are ready.';
 if(platform==='web') return 'Preferences saved. Local reminders are available in the installed iOS app, not in this web preview.';
 return `Saved. Notifications are unavailable or permission was denied. Enable them in ${platform==='ios'?'iPhone':'system'} Settings.`;
}
