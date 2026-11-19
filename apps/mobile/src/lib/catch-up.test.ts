/* eslint-disable import/first */
jest.mock("./backup", () => ({ backupDue: jest.fn(() => true), writeBackup: jest.fn(() => "file://b.json") }));
const organize = jest.fn();
jest.mock("@keystone/core", () => ({ ...jest.requireActual("@keystone/core"), organize: (...a: unknown[]) => organize(...a) }));
import { autoBackup, retryCaptures, sortCapture } from "./catch-up";
import { createStateQueue } from "./state-queue";
import type { Data } from "./store";
import { undoCapture } from "./undo";

const capture = (id: string, processed = false) => ({ id, text: id, source: "text" as const, createdAt: "", processed });
const make = (captures = [capture("a"), capture("b", true), capture("c")]) =>
  createStateQueue<Data>({ tasks: [], goals: [], captures, morning: "09:00", evening: false }, async () => {}, () => {});
const plan = (id: string) => ({ tasks: [{ id: `t-${id}`, title: id, area: "academics" }], goals: [], engine: "local" });

beforeEach(() => organize.mockReset());
test("retries only unprocessed captures and keeps going after a failure", async () => {
  organize.mockImplementation(async (c) => {
    if (c.id === "a") throw Error("offline");
    return plan(c.id);
  });
  const state = make();
  await retryCaptures(state, "");
  expect(organize.mock.calls.map((c) => c[0].id)).toEqual(["a", "c"]);
  expect(state.get().tasks.map((t) => t.id)).toEqual(["t-c"]);
  expect(state.get().captures.map((c) => c.processed)).toEqual([false, true, true]);
});
test("a capture being sorted is not sorted twice", async () => {
  let release!: () => void;
  organize.mockImplementation((c) => new Promise((r) => (release = () => r(plan(c.id)))));
  const state = make([capture("a")]);
  const first = sortCapture(state, state.get().captures[0], "");
  await retryCaptures(state, "");
  release();
  await first;
  expect(organize).toHaveBeenCalledTimes(1);
  expect(state.get().tasks).toHaveLength(1);
});
test.each(["first attempt", "retry"])("Undo removes goals created on %s but keeps unrelated goals", async (attempt) => {
  const item = capture("a");
  const state = make([item]);
  const createdGoals = new Set<string>();
  const goal = (id: string) => ({ id, title: id, area: "academics" as const, horizon: "short" as const, notes: "" });
  if (attempt === "retry") {
    organize.mockRejectedValueOnce(Error("offline"));
    await expect(sortCapture(state, item, "", createdGoals)).rejects.toThrow("offline");
  }
  await state.update((latest) => ({ ...latest, goals: [goal("manual")] }));

  organize.mockResolvedValueOnce({
    ...plan("a"),
    tasks: [{ ...plan("a").tasks[0], captureId: item.id, goalId: "generated" }],
    goals: [goal("generated")],
  });
  if (attempt === "retry") {
    await retryCaptures(state, "", (id) => id === item.id ? createdGoals : undefined);
  } else {
    await sortCapture(state, item, "", createdGoals);
  }

  expect(state.get().goals.map((g) => g.id)).toEqual(["manual", "generated"]);
  const undone = undoCapture(state.get(), item.id, createdGoals);
  expect(undone.goals.map((g) => g.id)).toEqual(["manual"]);
  expect(undone.captures).toEqual([]);
  expect(undone.tasks).toEqual([]);
});
test("records the backup time", async () => {
  const state = make([]);
  const now = new Date("2026-11-19T10:00:00Z");
  await autoBackup(state, now);
  expect(state.get().lastBackupAt).toBe(now.toISOString());
});
