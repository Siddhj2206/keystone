/* eslint-disable import/first */
jest.mock("./backup", () => ({ backupDue: jest.fn(() => true), writeBackup: jest.fn(() => "file://b.json") }));
const organize = jest.fn();
jest.mock("@keystone/core", () => ({ ...jest.requireActual("@keystone/core"), organize: (...a: unknown[]) => organize(...a) }));
import { autoBackup, retryCaptures, sortCapture } from "./catch-up";
import { createStateQueue } from "./state-queue";
import type { Data } from "./store";

const capture = (id: string, processed = false) => ({ id, text: id, source: "text" as const, createdAt: "", processed });
const make = (captures = [capture("a"), capture("b", true), capture("c")]) =>
  createStateQueue<Data>({ tasks: [], goals: [], captures, morning: "09:00", evening: false }, async () => {}, () => {});
const plan = (id: string) => ({ tasks: [{ id: `t-${id}` }], goals: [], engine: "local" });

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
test("records the backup time", async () => {
  const state = make([]);
  const now = new Date("2026-11-19T10:00:00Z");
  await autoBackup(state, now);
  expect(state.get().lastBackupAt).toBe(now.toISOString());
});
