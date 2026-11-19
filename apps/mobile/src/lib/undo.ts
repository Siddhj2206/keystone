import type { Data } from './store';

export function undoCapture(latest:Data,captureId:string,createdGoals:ReadonlySet<string>):Data {
 const tasks=latest.tasks.filter(t=>t.captureId!==captureId);
 return {...latest,tasks,captures:latest.captures.filter(c=>c.id!==captureId),goals:latest.goals.filter(g=>!createdGoals.has(g.id)||tasks.some(t=>t.goalId===g.id))};
}
