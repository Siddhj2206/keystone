import { createStateQueue } from './state-queue';
test('capture completion merges into edits made while organization was pending', async () => {
  const state = createStateQueue({tasks:['old'],goals:['g'],morning:'09:00',captures:['pending']},async()=>{},()=>{});
  await state.update(latest=>({...latest,tasks:['edited'],goals:['g','manual'],morning:'10:00'}));
  await state.update(latest=>({...latest,tasks:[...latest.tasks,'new'],goals:[...latest.goals,'suggested'],captures:['processed']}));
  expect(state.get()).toEqual({tasks:['edited','new'],goals:['g','manual','suggested'],morning:'10:00',captures:['processed']});
});
test('concurrent writes use the latest persisted state and empty updates work', async () => {
 const writes:number[]=[];const state=createStateQueue(0,async n=>{writes.push(n);},()=>{});
 await Promise.all([state.update(n=>n+1),state.update(n=>n+1),state.update(n=>n)]);
 expect(state.get()).toBe(2);expect(writes).toEqual([1,2,2]);
});
test('a failed write does not publish or poison the queue', async () => {
 const publish=jest.fn();let fail=true;const state=createStateQueue<number>(0,async()=>{if(fail)throw Error('disk');},publish);
 await expect(state.update(n=>n+1)).rejects.toThrow('disk');expect(publish).not.toHaveBeenCalled();fail=false;
 await state.update(n=>n+1);expect(state.get()).toBe(1);
});
