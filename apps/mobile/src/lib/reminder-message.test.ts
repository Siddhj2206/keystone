import { reminderMessage } from './reminder-message';
test('web explains native-only reminders without sending users to iPhone settings',()=>{expect(reminderMessage(false,'web')).toContain('web preview');expect(reminderMessage(false,'web')).not.toContain('iPhone Settings');});
test('native platforms get appropriate permission guidance',()=>{expect(reminderMessage(false,'ios')).toContain('iPhone Settings');expect(reminderMessage(false,'android')).toContain('system Settings');expect(reminderMessage(true,'ios')).toBe('Local reminders are ready.');});
