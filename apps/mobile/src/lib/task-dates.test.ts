import { localDateOf, deadlineForDate, withDueTime } from './task-dates';
test('notes/title-only edits preserve the exact due time',()=>{
 const due=new Date(2026,10,19,16,30,15).toISOString();
 expect(deadlineForDate(due,localDateOf(due))).toBe(due);
});
test.each(['2026-11-20T16:00:00','2026-11-20T23:30:00.123','2026-11-20T16:00:00+05:30'])('existing ISO deadline %s survives a notes-only save',due=>{
 const local=new Date(due);expect(localDateOf(due)).toBe(`${local.getFullYear()}-${String(local.getMonth()+1).padStart(2,'0')}-${String(local.getDate()).padStart(2,'0')}`);
 expect(deadlineForDate(due,localDateOf(due))).toBe(due);
});
test('offset-less timestamps are treated as local wall time',()=>{
 expect(localDateOf('2026-11-20T23:30:00')).toBe('2026-11-20');expect(new Date('2026-11-20T16:00:00').getHours()).toBe(16);
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
test('selecting a due time combines its local hour and minute with the selected date',()=>{
 expect(withDueTime('2026-11-21', new Date(2026, 10, 19, 9, 45, 12))).toBe(new Date(2026, 10, 21, 9, 45).toISOString());
});
