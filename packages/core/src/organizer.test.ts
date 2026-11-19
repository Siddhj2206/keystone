import {
  areaOf,
  dateOf,
  localOrganize,
  organize,
  focusTasks,
  Capture,
} from "./index";
const now = new Date("2026-11-19T10:00:00Z");
const capture = (text: string): Capture => ({
  id: "capture",
  text,
  source: "text",
  createdAt: now.toISOString(),
  processed: false,
});
describe("local organizer", () => {
  test.each([
    ["exam", "academics"],
    ["assignment", "academics"],
    ["lab", "academics"],
    ["apply", "career"],
    ["resume", "career"],
    ["interview", "career"],
    ["internship", "career"],
    ["learn", "skills"],
    ["course", "skills"],
    ["leetcode", "skills"],
    ["practice", "skills"],
    ["walk", "health"],
    ["buy milk", "life"],
    ["something", "other"],
  ])("%s → %s", (text, area) => expect(areaOf(text)).toBe(area));
  test.each([
    ["today", 19],
    ["tomorrow", 20],
    ["friday", 20],
    ["next week", 26],
    ["by 25th", 25],
  ])("date %s", (text, day) =>
    expect(new Date(dateOf(text, now)!).getDate()).toBe(day),
  );
  test("time and month rollover", () => {
    expect(new Date(dateOf("tomorrow at 3:30 pm", now)!).getHours()).toBe(15);
    expect(new Date(dateOf("by 2nd", now)!).getMonth()).toBe(11);
  });
  test("invalid dates and absent dates", () => {
    expect(dateOf("by 99th", now)).toBeUndefined();
    expect(dateOf("someday", now)).toBeUndefined();
    expect(dateOf("by 31st", now)).toBeUndefined();
  });
  test("splits actionable conjunctions without breaking titles", () => {
    const p = localOrganize(
      capture(
        "study data and algorithms tomorrow and apply for internship, buy milk\npractice leetcode",
      ),
      [],
      now,
    );
    expect(p.tasks).toHaveLength(4);
    expect(p.tasks[0].title).toContain("data and algorithms");
    expect(p.goals).toHaveLength(4);
  });
  test("links existing goals, sets priority and estimates", () => {
    const g = {
      id: "g",
      title: "CS",
      area: "academics" as const,
      horizon: "short" as const,
      notes: "",
    };
    const p = localOrganize(capture("urgent exam 45 minutes"), [g], now);
    expect(p.goals).toEqual([]);
    expect(p.tasks[0]).toMatchObject({
      goalId: "g",
      captureId: "capture",
      priority: 3,
      minutes: 45,
    });
  });
  test("unknown items stay in inbox", () =>
    expect(
      localOrganize(capture("think about things"), [], now).tasks[0].goalId,
    ).toBeUndefined());
  test("empty captures", () =>
    expect(localOrganize(capture(" \n "), []).tasks).toEqual([]));
  test("IDs unique", () => {
    const p = localOrganize(capture("lab\nlab"), []);
    expect(new Set(p.tasks.map((t) => t.id)).size).toBe(2);
    expect(p.goals).toHaveLength(1);
  });
  test("focus excludes completed and sleeping tasks", () => {
    const p = localOrganize(
      capture("exam today\napply tomorrow\nlearn next week\nbuy milk"),
      [],
      now,
    );
    p.tasks[0].status = "done";
    p.tasks[1].status = "snoozed";
    expect(focusTasks(p.tasks, now)).toHaveLength(2);
  });
  test("API failures fall back", async () => {
    global.fetch = jest.fn().mockRejectedValue(Error("offline"));
    expect((await organize(capture("exam"), [], "key")).engine).toBe("local");
  });
  test("malformed API results fall back", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: '{"tasks":[{}],"goals":[]}' }] } },
          ],
        }),
      });
    expect((await organize(capture("exam"), [], "key")).engine).toBe("local");
  });
  test("valid API results normalized", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      tasks: [
                        {
                          title: "Read",
                          area: "other",
                          priority: 2,
                          minutes: 20,
                        },
                      ],
                      goals: [],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      });
    expect((await organize(capture("read"), [], "key")).tasks[0]).toMatchObject(
      { status: "todo", captureId: "capture" },
    );
  });
});
