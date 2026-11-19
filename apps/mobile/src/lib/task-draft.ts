import { Task } from '@keystone/core';
import { localDateOf, deadlineForDate } from './task-dates';
export function taskDraft(task: Task) { return {title:task.title,notes:task.notes,date:localDateOf(task.dueDate),goalId:task.goalId,area:task.area}; }
export function applyTaskDraft(task:Task,draft:ReturnType<typeof taskDraft>):Task {
  if(!draft.title.trim()) throw Error('Add a task title.');
  return {...task,title:draft.title.trim(),notes:draft.notes,goalId:draft.goalId,area:draft.area,dueDate:deadlineForDate(task.dueDate,draft.date)};
}
export function taskEditorKey(task: Task): string { return JSON.stringify([task.id,task.title,task.notes,task.dueDate,task.goalId,task.area,task.status]); }
