import { Goal, Task, missed, nowAction, planDay, recover } from "./index";

const now = new Date("2026-11-19T10:00:00Z");
const task = (title: string, extra: Partial<Task> = {}): Task => ({
  id: title, title, notes: "", priority: 2, minutes: 30, status: "todo", captureId: "c", area: "academics", ...extra,
});
const goals: Goal[] = [{ id: "job", title: "Internship", horizon: "long", area: "career", notes: "" }];

test("plans at most 3 tasks and always includes a long-term step", () => {
  const tasks = ["a", "b", "c", "d"].map((t, i) => task(t, { dueDate: `2026-11-2${i}T10:00:00Z` }));
  const plan = planDay([...tasks, task("Apply", { goalId: "job" })], goals, now);
  expect(plan.map((t) => t.title)).toEqual(["a", "b", "Apply"]);
  expect(planDay(tasks, goals, now)).toHaveLength(3);
});
test("skips tasks waiting in Check and snoozed ones", () => {
  const plan = planDay([task("x", { checkBy: "2026-11-20T00:00:00Z" }), task("y", { status: "snoozed", dueDate: "2026-11-20T09:00:00Z" }), task("z")], [], now);
  expect(plan.map((t) => t.title)).toEqual(["z"]);
});
test("recovery spreads missed work over the next days", () => {
  const late = ["a", "b", "c"].map((t) => task(t, { dueDate: "2026-11-15T10:00:00Z" }));
  const out = recover(late, now);
  expect(missed(out, now)).toHaveLength(0);
  expect(out.map((t) => t.dueDate!.slice(0, 10))).toEqual(["2026-11-19", "2026-11-19", "2026-11-20"].map((d) => d));
  expect(planDay(out, [], now)).toHaveLength(2);
  expect(out.filter((t) => Date.parse(t.dueDate!) < now.getTime())).toHaveLength(0);
  expect(recover(out, now)).toBe(out);
  const fine = [task("ok")];
  expect(recover(fine, now)).toBe(fine);
});
test("Now card answers", () => {
  const t = task("Write report", { minutes: 90 });
  expect(nowAction([t], t, "done", now)[0]).toMatchObject({ status: "done" });
  expect(nowAction([t], t, "later", now)[0].status).toBe("snoozed");
  const big = nowAction([t], t, "tooBig", now);
  expect(big[0].title).toBe("First 10 minutes: Write report");
  expect(big).toHaveLength(2);
  expect(nowAction([t], t, "stuck", now)[0].title).toMatch(/blocking/);
});

test("tasks waiting in Check don't take recovery slots", () => {
  const out = recover([task("chk", { dueDate: "2026-11-15T10:00:00Z", checkBy: "2026-11-20T00:00:00Z" }), task("a", { dueDate: "2026-11-15T10:00:00Z" })], now);
  expect(out[0].dueDate).toBe("2026-11-15T10:00:00Z");
  expect(out[1].status).toBe("todo");
});
