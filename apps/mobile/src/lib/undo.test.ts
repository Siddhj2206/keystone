import { undoCapture } from './undo';
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
