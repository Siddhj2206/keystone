/* eslint-disable import/first */
const tables: Record<string, Map<string, string>> = {};
const runs: string[] = [];
const fake = {
  execAsync: jest.fn(async () => {}),
  withTransactionAsync: async (f: () => Promise<void>) => f(),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(async (sql: string) => {
    const t = sql.match(/FROM (\w+)/)![1];
    return [...(tables[t] ?? new Map()).entries()].map(([id, json]) => ({ id, key: id, json }));
  }),
  runAsync: jest.fn(async (sql: string, ...args: string[]) => {
    runs.push(sql.split(" ").slice(0, 3).join(" "));
    const t = sql.match(/(?:INTO|FROM) (\w+)/)![1];
    if (!sql.startsWith("DELETE") && t !== "prefs") expect(sql).toMatch(/ON CONFLICT\(id\) DO UPDATE/);
    tables[t] ??= new Map();
    if (sql.startsWith("DELETE")) tables[t].delete(args[0]);
    else tables[t].set(args[0], args[args.length - 1]);
  }),
};
jest.mock("expo-sqlite", () => ({ openDatabaseAsync: async () => fake }));
import { loadRows, saveRows } from "./db";

const task = { id: "t1", title: "Lab", notes: "", priority: 2, minutes: 30, status: "todo", captureId: "c", area: "academics" } as const;
test("migrates the v1 JSON row into tables", async () => {
  fake.getFirstAsync.mockResolvedValueOnce({ json: JSON.stringify({ tasks: [task], goals: [], captures: [], morning: "08:00", evening: true }) });
  const rows = await loadRows();
  expect(rows).toEqual({ tasks: [task], goals: [], captures: [], prefs: { morning: "08:00", evening: true } });
  expect([...tables.tasks.keys()]).toEqual(["t1"]);
  expect(runs).toContain("DELETE FROM state");
});
test("saves only changed rows and deletes removed ones", async () => {
  runs.length = 0;
  const done = { ...task, status: "done" as const };
  const t2 = { ...task, id: "t2" };
  await saveRows({ tasks: [done, t2], goals: [], captures: [], prefs: { morning: "08:00", evening: true } });
  expect(runs).toEqual(["INSERT INTO tasks", "INSERT INTO tasks"]);
  runs.length = 0;
  await saveRows({ tasks: [t2], goals: [], captures: [], prefs: { morning: "08:00", evening: true } });
  expect(runs).toEqual(["DELETE FROM tasks"]);
  fake.getFirstAsync.mockResolvedValueOnce(null);
  expect((await loadRows())?.tasks).toEqual([t2]);
});
