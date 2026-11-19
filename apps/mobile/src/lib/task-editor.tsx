import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Goal, Task } from '@keystone/core';
import { taskDraft, applyTaskDraft } from './task-draft';
import { Button, Input, Label, usePalette } from './ui';
export function TaskEditor({task,goals,onSave,onClose}: {task:Task;goals:Goal[];onSave:(task:Task)=>Promise<void>;onClose:()=>void}): React.JSX.Element {
 const c=usePalette();const [draft,setDraft]=useState(()=>taskDraft(task));const [error,setError]=useState('');
 return <View style={{gap:12}}><Input value={draft.title} onChangeText={title=>setDraft({...draft,title})} placeholder="Task title"/><Input value={draft.notes} onChangeText={notes=>setDraft({...draft,notes})} placeholder="Notes" multiline/><Input value={draft.date} onChangeText={date=>setDraft({...draft,date})} placeholder="Due date YYYY-MM-DD (optional)"/>
 <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>{goals.map(g=><Pressable key={g.id} onPress={()=>setDraft({...draft,goalId:g.id,area:g.area})}><Label style={{fontSize:12,color:draft.goalId===g.id?c.accent:c.muted}}>{g.title}</Label></Pressable>)}</View>
 <Button title="Save details" onPress={()=>{try{onSave(applyTaskDraft(task,draft)).then(onClose).catch(e=>setError(String(e)));}catch(e){setError(String(e));}}}/>{!!error&&<Label>{error}</Label>}</View>;
}
