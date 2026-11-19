import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Goal, Task } from '@keystone/core';
import { taskDraft } from './task-draft';
import { deadlineForDate } from './task-dates';
import { Button, Input, Label, usePalette } from './ui';
export function TaskEditor({task,goals,onSave,onClose}: {task:Task;goals:Goal[];onSave:(task:Task)=>Promise<void>;onClose:()=>void}): React.JSX.Element {
 const c=usePalette();const [draft,setDraft]=useState(()=>taskDraft(task));const [error,setError]=useState('');
 return <View style={{gap:12}}><Input value={draft.title} onChangeText={title=>setDraft({...draft,title})} placeholder="Task title"/><Input value={draft.notes} onChangeText={notes=>setDraft({...draft,notes})} placeholder="Notes" multiline/><Input value={draft.date} onChangeText={date=>setDraft({...draft,date})} placeholder="Due date YYYY-MM-DD (optional)"/>
 <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>{goals.map(g=><Pressable key={g.id} onPress={()=>{onSave({...task,goalId:g.id,area:g.area}).catch(e=>setError(String(e)));}}><Label style={{fontSize:12,color:task.goalId===g.id?c.accent:c.muted}}>{g.title}</Label></Pressable>)}</View>
 <Button title="Save details" onPress={()=>{try{if(!draft.title.trim())throw Error('Add a task title.');const next={...task,title:draft.title.trim(),notes:draft.notes,dueDate:deadlineForDate(task.dueDate,draft.date)};onSave(next).then(onClose).catch(e=>setError(String(e)));}catch(e){setError(String(e));}}}/>{!!error&&<Label>{error}</Label>}</View>;
}
