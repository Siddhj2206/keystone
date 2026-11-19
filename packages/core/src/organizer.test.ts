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
  test.each([
    [
      "Finish OS assignment tomorrow at 4 pm",
      "Finish OS assignment",
      "tomorrow at 4 pm",
    ],
    ["Buy groceries today", "Buy groceries", "today"],
    ["apply for an internship on Friday", "Apply for an internship", "friday"],
    ["practice leetcode next week", "Practice leetcode", "next week"],
    ["submit lab by 25th", "Submit lab", "by 25th"],
    [
      "tomorrow at 3:30 pm review resume",
      "Review resume",
      "tomorrow at 3:30 pm",
    ],
    ["study by tomorrow at 4 pm", "Study", "tomorrow at 4 pm"],
    ["call today at", "Call", "today"],
    ["call today on", "Call", "today"],
    ["call today by", "Call", "today"],
    ["today", "Untitled task", "today"],
  ])("cleans title %s without losing its schedule", (text, title, schedule) => {
    const task = localOrganize(capture(text), [], now).tasks[0];
    expect(task.title).toBe(title);
    expect(task.dueDate).toBe(dateOf(schedule, now));
  });
  test.each([
    ["buy groceries", "Buy groceries"],
    ["learn about on-device recognition", "Learn about on-device recognition"],
    ["submit lab by 99th", "Submit lab by 99th"],
    ["submit lab by 31st", "Submit lab by 31st"],
    ["call at 4 pm", "Call at 4 pm"],
  ])(
    "preserves unrecognized schedules and meaningful words in %s",
    (text, title) => {
      const task = localOrganize(capture(text), [], now).tasks[0];
      expect(task.title).toBe(title);
      expect(task.dueDate).toBeUndefined();
    },
  );
  test("does not strip invalid times or alter capture text", () => {
    const input = capture("study tomorrow at 14 pm");
    const task = localOrganize(input, [], now).tasks[0];
    expect(task.title).toBe("Study at 14 pm");
    expect(task.dueDate).toBe(dateOf("tomorrow", now));
    expect(input.text).toBe("study tomorrow at 14 pm");
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

test("dates are read relative to when the capture was made", async () => {
  const { organize } = await import("./index");
  const plan = await organize({ id: "c", text: "submit lab tomorrow", source: "text", createdAt: "2026-01-10T06:00:00.000Z", processed: false }, []);
  expect(plan.tasks[0].dueDate?.slice(0, 10)).toBe("2026-01-11");
});
