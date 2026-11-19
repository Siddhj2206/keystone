import { organize, Capture, Goal, isISODateString } from './index';
const capture: Capture={id:'c',text:'buy milk today',source:'text',createdAt:new Date().toISOString(),processed:false};
const task={title:'Buy milk',area:'life',priority:2,minutes:20};
function respond(tasks:unknown[],goals:unknown[]=[]):void { global.fetch=jest.fn().mockResolvedValue({ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({tasks,goals})}]}}]})}); }
test.each([0,null,false,'','Friday','2026-02-30','2026-01-01T25:00:00Z',{},[]])('rejects invalid dueDate %j',async dueDate=>{
 respond([{...task,dueDate}]);expect((await organize(capture,[],'key')).engine).toBe('local');
});
test.each(['2026-11-20','2026-11-20T16:00:00Z','2026-11-20T16:30:00.123+05:30'])('accepts valid ISO date %s',async dueDate=>{
 respond([{...task,dueDate}]);expect((await organize(capture,[],'key')).tasks[0].dueDate).toBe(dueDate);expect(isISODateString(dueDate)).toBe(true);
});
test.each([{notes:0},{goalId:0},{goalId:null},{goalId:'missing'},{priority:0},{minutes:-1}])('rejects invalid task fields %j',async fields=>{
 respond([{...task,...fields}]);expect((await organize(capture,[],'key')).engine).toBe('local');
});
test.each([{title:''},{notes:0},{targetDate:0},{targetDate:'2026-02-30'}])('rejects invalid goal fields %j',async fields=>{
 respond([task],[{id:'g',title:'Life',area:'life',horizon:'short',notes:'',...fields}]);expect((await organize(capture,[],'key')).engine).toBe('local');
});
test('new goals get fresh IDs even if the model reuses an existing ID',async()=>{
 const existing:Goal={id:'existing',title:'Career',area:'career',horizon:'long',notes:''};
 respond([{...task,goalId:'existing'}],[{...existing,title:'A new goal'}]);
 const plan=await organize(capture,[existing],'key');expect(plan.engine).toBe('gemini');expect(plan.goals[0].id).not.toBe(existing.id);expect(plan.tasks[0].goalId).toBe(plan.goals[0].id);expect(existing.title).toBe('Career');
});
test('valid existing links are retained, and distinct new links are remapped',async()=>{
 const existing:Goal={id:'existing',title:'Life',area:'life',horizon:'short',notes:''};
 respond([{...task,goalId:'existing'},{...task,goalId:'new'}],[{...existing,id:'new',title:'New'}]);
 const plan=await organize(capture,[existing],'key');expect(plan.tasks[0].goalId).toBe('existing');expect(plan.tasks[1].goalId).toBe(plan.goals[0].id);expect(plan.goals[0].id).not.toBe('new');
});
test('ambiguous duplicate model IDs fall back rather than link arbitrarily',async()=>{
 const goal={id:'dup',title:'Life',area:'life',horizon:'short',notes:''};respond([task],[goal,goal]);expect((await organize(capture,[],'key')).engine).toBe('local');
});
