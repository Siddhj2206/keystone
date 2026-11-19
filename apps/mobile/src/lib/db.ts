import * as SQLite from "expo-sqlite";
import type { Capture, Goal, Task } from "@keystone/core";

export interface Rows {
  tasks: Task[];
  goals: Goal[];
  captures: Capture[];
  prefs: Record<string, unknown>;
}
type Table = "tasks" | "goals" | "captures";
const tables: Table[] = ["tasks", "goals", "captures"];
const db = SQLite.openDatabaseAsync("keystone.db");
let saved: Record<Table, Map<string, string>> & { prefs: Map<string, string> } = {
  tasks: new Map(),
  goals: new Map(),
  captures: new Map(),
  prefs: new Map(),
};

export async function loadRows(): Promise<Rows | undefined> {
  const c = await db;
  await c.execAsync(`
    CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY, json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, status TEXT, due_date TEXT, goal_id TEXT, json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS goals (id TEXT PRIMARY KEY, area TEXT, horizon TEXT, json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS captures (id TEXT PRIMARY KEY, processed INTEGER, created_at TEXT, json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS prefs (key TEXT PRIMARY KEY, json TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS tasks_due ON tasks (status, due_date);
  `);
  const legacy = await c.getFirstAsync<{ json: string }>("SELECT json FROM state WHERE id=1");
  if (legacy) {
    const { tasks = [], goals = [], captures = [], ...prefs } = JSON.parse(legacy.json);
    const rows = { tasks, goals, captures, prefs };
    await saveRows(rows);
    await c.runAsync("DELETE FROM state WHERE id=1");
    return rows;
  }
  const read = async <T,>(table: Table): Promise<T[]> => {
    const all = await c.getAllAsync<{ id: string; json: string }>(`SELECT id, json FROM ${table}`);
    saved[table] = new Map(all.map((r) => [r.id, r.json]));
    return all.map((r) => JSON.parse(r.json));
  };
  const tasks = await read<Task>("tasks");
  const goals = await read<Goal>("goals");
  const captures = await read<Capture>("captures");
  const prefRows = await c.getAllAsync<{ key: string; json: string }>("SELECT key, json FROM prefs");
  saved.prefs = new Map(prefRows.map((r) => [r.key, r.json]));
  if (!tasks.length && !goals.length && !captures.length && !prefRows.length) return undefined;
  return { tasks, goals, captures, prefs: Object.fromEntries(prefRows.map((r) => [r.key, JSON.parse(r.json)])) };
}

function columns(table: Table, row: Task | Goal | Capture): unknown[] {
  if (table === "tasks") {
    const t = row as Task;
    return [t.status, t.dueDate ?? null, t.goalId ?? null];
  }
  if (table === "goals") {
    const g = row as Goal;
    return [g.area, g.horizon];
  }
  const x = row as Capture;
  return [x.processed ? 1 : 0, x.createdAt];
}
const insert: Record<Table, string> = {
  tasks: "INSERT OR REPLACE INTO tasks (id, status, due_date, goal_id, json) VALUES (?,?,?,?,?)",
  goals: "INSERT OR REPLACE INTO goals (id, area, horizon, json) VALUES (?,?,?,?)",
  captures: "INSERT OR REPLACE INTO captures (id, processed, created_at, json) VALUES (?,?,?,?)",
};

/** Writes only the rows that changed since the last load or save. */
export async function saveRows(rows: Rows): Promise<void> {
  const c = await db;
  const next = { tasks: new Map<string, string>(), goals: new Map<string, string>(), captures: new Map<string, string>(), prefs: new Map<string, string>() };
  await c.withTransactionAsync(async () => {
    for (const table of tables)
      for (const row of rows[table] as (Task | Goal | Capture)[]) {
        const json = JSON.stringify(row);
        next[table].set(row.id, json);
        if (saved[table].get(row.id) !== json)
          await c.runAsync(insert[table], row.id, ...(columns(table, row) as SQLite.SQLiteBindValue[]), json);
      }
    for (const [key, value] of Object.entries(rows.prefs)) {
      if (value === undefined) continue;
      const json = JSON.stringify(value);
      next.prefs.set(key, json);
      if (saved.prefs.get(key) !== json)
        await c.runAsync("INSERT OR REPLACE INTO prefs (key, json) VALUES (?,?)", key, json);
    }
    for (const table of [...tables, "prefs"] as const)
      for (const old of saved[table].keys())
        if (!next[table].has(old))
          await c.runAsync(`DELETE FROM ${table} WHERE ${table === "prefs" ? "key" : "id"}=?`, old);
  });
  saved = next;
}
