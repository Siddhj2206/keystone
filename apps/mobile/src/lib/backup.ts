import { Platform } from "react-native";
import { Directory, File, Paths } from "expo-file-system";
import type { Capture, Goal, Task } from "@keystone/core";

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
  for (const t of parsed.tasks)
    if (typeof t?.id !== "string" || typeof t?.title !== "string") throw Error("The backup has a damaged task.");
  for (const g of parsed.goals)
    if (typeof g?.id !== "string" || typeof g?.title !== "string") throw Error("The backup has a damaged goal.");
  const { version: _v, exportedAt: _e, key: _k, ...data } = parsed;
  return { ...data, captures: Array.isArray(parsed.captures) ? parsed.captures : [] };
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
