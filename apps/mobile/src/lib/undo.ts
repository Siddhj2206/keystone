import type { Data } from './store';
import type { Task } from '@keystone/core';

export function undoCapture(latest:Data,captureId:string,createdGoals:ReadonlySet<string>):Data {
 const tasks=latest.tasks.filter(t=>t.captureId!==captureId);
 return {...latest,tasks,captures:latest.captures.filter(c=>c.id!==captureId),goals:latest.goals.filter(g=>!createdGoals.has(g.id)||tasks.some(t=>t.goalId===g.id))};
}

export function commandUndo(before:Task,after:Task|undefined,index:number):(latest:Data)=>Data {
 if(!after) return latest=>latest.tasks.some(t=>t.id===before.id)?latest:{...latest,tasks:[...latest.tasks.slice(0,index),before,...latest.tasks.slice(index)]};
 const fields=(Object.keys({...before,...after}) as (keyof Task)[]).filter(key=>!Object.is(before[key],after[key]));
 return latest=>({...latest,tasks:latest.tasks.map(task=>task.id!==before.id?task:{...task,...Object.fromEntries(fields.filter(key=>Object.is(task[key],after[key])).map(key=>[key,before[key]]))})});
}
