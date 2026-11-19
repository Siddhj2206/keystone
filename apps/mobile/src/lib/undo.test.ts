import { undoCapture,commandUndo } from './undo';
import type { Data } from './store';
const task={id:'t',title:'Read',notes:'',area:'skills',priority:2,minutes:20,status:'todo',captureId:'c',goalId:'generated'} as const;
const goal={id:'generated',title:'Learn',notes:'',area:'skills',horizon:'long'} as const;
const data:Data={tasks:[task],goals:[goal,{...goal,id:'manual'}],captures:[{id:'c',text:'Read',source:'text',createdAt:new Date().toISOString(),processed:true}],morning:'09:00',evening:false};
test('capture Undo removes only goals created by that capture, not later manual goals',()=>{
 const result=undoCapture(data,'c',new Set(['generated']));expect(result.tasks).toEqual([]);expect(result.captures).toEqual([]);expect(result.goals.map(g=>g.id)).toEqual(['manual']);expect(data.tasks).toHaveLength(1);
});
test('capture Undo keeps its generated goal when later tasks use it',()=>{
 const result=undoCapture({...data,tasks:[task,{...task,id:'later',captureId:'later'}]},'c',new Set(['generated']));expect(result.goals).toEqual(data.goals);expect(result.tasks.map(t=>t.id)).toEqual(['later']);
});
test('pending/absent captures and empty undo ownership never remove unrelated goals',()=>{
 expect(undoCapture(data,'missing',new Set())).toEqual(data);expect(undoCapture({...data,tasks:[]},'c',new Set()).goals).toEqual(data.goals);
});
test('command Undo restores changed fields without wiping later title/notes edits',()=>{
 const after={...task,status:'done' as const,completedAt:'2026-11-20T10:00:00Z'};
 const undo=commandUndo(task,after,0);const current={...after,title:'Updated title',notes:'New notes',minutes:45};
 expect(undo({...data,tasks:[current]}).tasks[0]).toMatchObject({...task,title:'Updated title',notes:'New notes',minutes:45,completedAt:undefined});
});
test('command Undo preserves later edits to a changed field and does not resurrect later deletions',()=>{
 const after={...task,status:'snoozed' as const,dueDate:'2026-11-21T09:00:00Z'};const undo=commandUndo(task,after,0);
 expect(undo({...data,tasks:[{...after,dueDate:'2026-12-01T10:00:00Z'}]}).tasks[0].dueDate).toBe('2026-12-01T10:00:00Z');expect(undo({...data,tasks:[]}).tasks).toEqual([]);
});
test('drop Undo restores position once and never replaces a later task with the same id',()=>{
 const undo=commandUndo(task,undefined,0);expect(undo({...data,tasks:[]}).tasks).toEqual([task]);const edited={...task,notes:'Later'};expect(undo({...data,tasks:[edited]}).tasks).toEqual([edited]);
});
