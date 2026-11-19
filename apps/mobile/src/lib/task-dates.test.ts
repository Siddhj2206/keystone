import { localDateOf, deadlineForDate } from './task-dates';
test('notes/title-only edits preserve the exact due time',()=>{
 const due=new Date(2026,10,19,16,30,15).toISOString();
 expect(deadlineForDate(due,localDateOf(due))).toBe(due);
});
test('date drafts use the local calendar day even for evening deadlines',()=>{
 const due=new Date(2026,10,19,23,30).toISOString();expect(localDateOf(due)).toBe('2026-11-19');
});
test('changed dates default to 18:00 local; removing a date clears it',()=>{
 const due=deadlineForDate('2026-11-19T16:00:00Z','2026-11-21')!;expect(new Date(due).getHours()).toBe(18);expect(localDateOf(due)).toBe('2026-11-21');expect(deadlineForDate(due,'')).toBeUndefined();
});
test('invalid persisted dates are safe and impossible dates are rejected',()=>{
 expect(localDateOf(0)).toBe('');expect(localDateOf('invalid')).toBe('');expect(()=>deadlineForDate(undefined,'2026-02-30')).toThrow();expect(()=>deadlineForDate(undefined,'Friday')).toThrow();
});
