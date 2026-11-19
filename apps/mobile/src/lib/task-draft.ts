import { Task } from '@keystone/core';
import { localDateOf } from './task-dates';
export function taskDraft(task: Task) { return {title:task.title,notes:task.notes,date:localDateOf(task.dueDate)}; }
export function taskEditorKey(task: Task): string { return JSON.stringify([task.id,task.title,task.notes,task.dueDate,task.goalId,task.area,task.status]); }
