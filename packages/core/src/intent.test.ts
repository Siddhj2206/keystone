import { answer, autoAccept, classify, matchTask, ruleWord, triage, Task, refileTask } from "./index";

const task = (title: string, extra: Partial<Task> = {}): Task => ({
  id: title, title, notes: "", priority: 2, minutes: 30, status: "todo", captureId: "c", area: "academics", ...extra,
});
const now = new Date("2026-11-19T10:00:00Z");

test.each([
  ["I finished the DBMS assignment", "done", "the DBMS assignment"],
  ["done with os lab.", "done", "os lab"],
  ["mark resume as done", "done", "resume"],
  ["DSA sheet is done", "done", "DSA sheet"],
  ["move the resume to tomorrow", "snooze", "the resume"],
  ["drop leetcode daily", "drop", "leetcode daily"],
])("%s is a %s command", (text, kind, query) => expect(classify(text)).toEqual({ kind, query }));

test.each([
  ["what's due this week?", "week"],
  ["What should I do next", "next"],
  ["what's on today?", "today"],
  ["what are my goals?", "goals"],
])("%s is a question about %s", (text, topic) => expect(classify(text)).toEqual({ kind: "question", topic }));

test.each(["submit DBMS assignment by friday", "apply to 3 internships this week", "finish OS notes"])(
  "%s is a capture",
  (text) => expect(classify(text).kind).toBe("capture"),
);

test("matches tasks by spoken reference", () => {
  const tasks = [task("Submit DBMS assignment"), task("Update resume"), task("OS lab record", { status: "done" })];
  expect(matchTask("the dbms assignment", tasks)?.title).toBe("Submit DBMS assignment");
  expect(matchTask("resume", tasks)?.title).toBe("Update resume");
  expect(matchTask("OS lab", tasks)).toBeUndefined();
  expect(matchTask("groceries", tasks)).toBeUndefined();
});

test("answers from local data", () => {
  const tasks = [task("Lab", { dueDate: "2026-11-21T10:00:00Z" }), task("Later", { dueDate: "2026-12-30T10:00:00Z" })];
  expect(answer("week", tasks, [], [], now)).toBe("Due this week: Lab.");
  expect(answer("next", tasks, [], [tasks[0]], now)).toBe("Next: Lab.");
  expect(answer("week", [], [], [], now)).toMatch(/Nothing is due/);
});

test("unsure guesses go to the Check stack and learned rules override", () => {
  const [sure, unsure] = triage([task("Lab"), task("Call Rahul", { area: "other" })], {}, now);
  expect(sure.checkBy).toBeUndefined();
  expect(unsure.checkBy).toBe("2026-11-21T10:00:00.000Z");
  const learned = triage([task("Call Rahul", { area: "other" })], { rahul: "career" }, now)[0];
  expect(learned.area).toBe("career");
  expect(learned.checkBy).toBeUndefined();
  expect(ruleWord("Call Rahul about the referral")).toBe("referral");
});

test("checks are accepted after 48 hours", () => {
  const t = task("x", { checkBy: "2026-11-19T09:00:00Z" });
  const keep = task("y", { checkBy: "2026-11-20T09:00:00Z" });
  expect(autoAccept([t, keep], now).map((x) => x.checkBy)).toEqual([undefined, keep.checkBy]);
  const same = [keep];
  expect(autoAccept(same, now)).toBe(same);
});

test("words like constructor are not learned areas", () => {
  expect(triage([task("Read constructor chapter")], {}, now)[0].area).toBe("academics");
});
test('learned or explicit area corrections remove stale goal links and settle Check',()=>{
 const original=task('Call Rahul',{area:'academics',goalId:'semester',checkBy:'2026-11-20T00:00:00Z'});
 expect(triage([original],{rahul:'career'},now)[0]).toMatchObject({area:'career',goalId:undefined,checkBy:undefined});expect(refileTask(original,'career').goalId).toBeUndefined();expect(original.goalId).toBe('semester');
});
test('same-area corrections preserve goal links; empty and unmatched triage are unchanged',()=>{
 const original=task('Read textbook',{goalId:'semester'});expect(triage([original],{textbook:'academics'},now)[0].goalId).toBe('semester');expect(refileTask(original,'academics').goalId).toBe('semester');expect(triage([],{},now)).toEqual([]);expect(triage([original],{},now)[0]).toBe(original);
});

test("prefers the closest title when several match", () => {
  expect(matchTask("resume", [task("Update resume"), task("Resume")])?.title).toBe("Resume");
});
