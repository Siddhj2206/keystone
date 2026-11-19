import { lookOf, looks } from "./looks";
import { demoData } from "./demo";
import { streakOf } from "./streak";
test.each(["a", "b", "c"] as const)(
  "resolves look %s with full area tokens",
  (look) => {
    expect(lookOf(look)).toBe(look);
    expect(Object.keys(looks[look].area)).toHaveLength(6);
    expect(looks[look].display).toBeTruthy();
  },
);
test.each([undefined, null, "", "invalid", 0])(
  "invalid or missing default %j falls back to A",
  (value) => expect(lookOf(value)).toBe("a"),
);
test("demo is deterministic, linked, and uses relative deadlines without mutating the clock", () => {
  const now = new Date(2026, 10, 20, 12);
  const snapshot = now.toISOString();
  const demo = demoData(now);
  expect(demo).toEqual(demoData(now));
  expect(demo.tasks).toHaveLength(6);
  expect(new Set(demo.tasks.map((t) => t.id)).size).toBe(6);
  expect(
    demo.tasks.every((t) => demo.goals.some((g) => g.id === t.goalId)),
  ).toBe(true);
  expect(
    demo.tasks
      .filter((t) => t.dueDate)
      .every((t) => Number.isFinite(Date.parse(t.dueDate!))),
  ).toBe(true);
  expect(now.toISOString()).toBe(snapshot);
  expect(streakOf(demo.tasks, now)).toBe(1);
});
test("empty, invalid and nonconsecutive completion histories do not invent a streak", () => {
  const now = new Date(2026, 10, 20, 12);
  expect(streakOf([], now)).toBe(0);
  const task = demoData(now).tasks[0];
  expect(
    streakOf([{ ...task, status: "done", completedAt: "invalid" }], now),
  ).toBe(0);
  expect(
    streakOf(
      [
        {
          ...task,
          status: "done",
          completedAt: new Date(2026, 10, 18).toISOString(),
        },
      ],
      now,
    ),
  ).toBe(0);
  expect(
    streakOf(
      [20, 19, 19].map((day, i) => ({
        ...task,
        id: String(i),
        status: "done",
        completedAt: new Date(2026, 10, day, 9).toISOString(),
      })),
      now,
    ),
  ).toBe(2);
});
