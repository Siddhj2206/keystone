export function reminderMessage(enabled:boolean,platform:string):string {
 if(enabled) return 'Local reminders are ready.';
 if(platform==='web') return 'Preferences saved. Local reminders are available in the installed iOS app, not in this web preview.';
 return `Saved. Notifications are unavailable or permission was denied. Enable them in ${platform==='ios'?'iPhone':'system'} Settings.`;
}
