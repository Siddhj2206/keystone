import { Platform } from "react-native";
import { Directory, File, Paths } from "expo-file-system";
import type { Capture, Goal, Task } from "@keystone/core";
import { isISODateString } from '@keystone/core';

const WEEK = 7 * 86400000;
const KEEP = 4;
export interface BackupData {
  tasks: Task[];
  goals: Goal[];
  captures: Capture[];
}

export function backupDue(lastBackupAt: string | undefined, now = new Date()): boolean {
  return !lastBackupAt || now.getTime() - Date.parse(lastBackupAt) >= WEEK;
}

export function backupJson(data: BackupData, now = new Date()): string {
  return JSON.stringify({ version: 2, exportedAt: now.toISOString(), ...data }, null, 2);
}

/** Validates an export or backup file and returns its data. */
export function parseBackup(json: string): BackupData & Record<string, unknown> {
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.goals))
    throw Error("That file isn't a Keystone backup.");
  const str = (x: unknown) => typeof x === "string";
  const areas=['academics','career','skills','health','life','other'];
  const optionalDate=(x:unknown)=>x===undefined||x===''||isISODateString(x);
  for (const t of parsed.tasks)
    if (!str(t?.id) || !str(t?.title) || !areas.includes(t?.area) || !['todo','done','snoozed'].includes(t?.status) || !str(t?.notes) || !str(t?.captureId) || ![1,2,3].includes(t?.priority) || !Number.isFinite(t?.minutes) || t.minutes<=0 || (t.goalId!==undefined&&!str(t.goalId)) || !optionalDate(t.dueDate) || !optionalDate(t.completedAt) || !optionalDate(t.checkBy)) throw Error("The backup has a damaged task.");
  for (const g of parsed.goals)
    if (!str(g?.id) || !str(g?.title) || !areas.includes(g?.area) || !['short','long'].includes(g?.horizon) || !str(g?.notes) || !optionalDate(g.targetDate)) throw Error("The backup has a damaged goal.");
  if(parsed.captures!==undefined&&!Array.isArray(parsed.captures)) throw Error('The backup has damaged captures.');
  for(const c of parsed.captures??[])
    if(!str(c?.id)||!str(c?.text)||!['text','voice'].includes(c?.source)||!isISODateString(c?.createdAt)||typeof c?.processed!=='boolean') throw Error('The backup has a damaged capture.');
  if((parsed.morning!==undefined&&(!str(parsed.morning)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(parsed.morning))) || (parsed.evening!==undefined&&typeof parsed.evening!=='boolean') || !optionalDate(parsed.lastBackupAt) || (parsed.rules!==undefined&&(!parsed.rules||typeof parsed.rules!=='object'||Array.isArray(parsed.rules)||!Object.values(parsed.rules).every(area=>areas.includes(area as string))))) throw Error('The backup has damaged preferences.');
  const { version: _v, exportedAt: _e, key: _k, ...data } = parsed;
  return {
    ...data,
    tasks: parsed.tasks.map((t:Task)=>({...t,dueDate:t.dueDate||undefined,completedAt:t.completedAt||undefined,checkBy:t.checkBy||undefined})),
    goals: parsed.goals.map((g:Goal)=>({...g,targetDate:g.targetDate||undefined})),
    lastBackupAt: data.lastBackupAt||undefined,
    captures: Array.isArray(parsed.captures) ? parsed.captures : [],
  };
}

/** Weekly JSON into Documents/Backups, which the Files app shows under On My iPhone › Keystone. */
export function writeBackup(data: BackupData, now = new Date()): string | undefined {
  if (Platform.OS === "web") return undefined;
  const dir = new Directory(Paths.document, "Backups");
  if (!dir.exists) dir.create();
  const file = new File(dir, `keystone-${now.toISOString().slice(0, 10)}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(backupJson(data, now));
  const old = dir
    .list()
    .filter((f): f is File => f instanceof File && /^keystone-\d{4}-\d{2}-\d{2}\.json$/.test(f.name))
    .sort((a, b) => b.name.localeCompare(a.name))
    .slice(KEEP);
  for (const f of old) f.delete();
  return file.uri;
}
