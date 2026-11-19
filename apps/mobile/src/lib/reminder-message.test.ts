import { reminderMessage, reminderTimeOrDefault } from './reminder-message';
test('web explains native-only reminders without sending users to iPhone settings',()=>{expect(reminderMessage(false,'web')).toContain('web preview');expect(reminderMessage(false,'web')).not.toContain('iPhone Settings');});
test('native platforms get appropriate permission guidance',()=>{expect(reminderMessage(false,'ios')).toContain('iPhone Settings');expect(reminderMessage(false,'android')).toContain('system Settings');expect(reminderMessage(true,'ios')).toBe('Local reminders are ready.');});
test.each([null, 930, 'morning', '09:99', '24:00'])('uses the default time for a malformed restored preference %p', (value) => {
 expect(reminderTimeOrDefault(value)).toBe('09:00');
});
test('keeps a valid restored time', () => {
 expect(reminderTimeOrDefault('23:59')).toBe('23:59');
});
