import { organize, Capture, isISODateString } from './index';
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
