import { Task } from '@keystone/core';
import { taskDraft, taskEditorKey, applyTaskDraft } from './task-draft';
const task:Task={id:'t',title:'Read',notes:'',dueDate:new Date(2026,10,19,16).toISOString(),priority:2,minutes:25,area:'life',status:'todo',captureId:'c'};
test('opening after snooze initializes the new local date and remounts an open editor',()=>{
 const snoozed={...task,status:'snoozed' as const,dueDate:new Date(2026,10,20,9).toISOString()};
 expect(taskDraft(snoozed).date).toBe('2026-11-20');expect(taskEditorKey(snoozed)).not.toBe(taskEditorKey(task));
});
test('editor key is stable for identical tasks and changes for updated notes',()=>{
 expect(taskEditorKey({...task})).toBe(taskEditorKey(task));expect(taskEditorKey({...task,notes:'new'})).not.toBe(taskEditorKey(task));
});
test('linking a goal includes title, notes and date drafts in one save',()=>{
 const draft={...taskDraft(task),title:'Edited title',notes:'Edited notes',date:'2026-11-23',goalId:'new-goal',area:'skills' as const};
 const saved=applyTaskDraft(task,draft);expect(saved).toMatchObject({title:'Edited title',notes:'Edited notes',goalId:'new-goal',area:'skills'});expect(taskDraft(saved).date).toBe('2026-11-23');expect(task.goalId).toBeUndefined();
});
test('draft saves reject empty titles and invalid dates without changing the task',()=>{
 expect(()=>applyTaskDraft(task,{...taskDraft(task),title:' '})).toThrow();expect(()=>applyTaskDraft(task,{...taskDraft(task),date:'2026-02-30'})).toThrow();expect(task.title).toBe('Read');
});
