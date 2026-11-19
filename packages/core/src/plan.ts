import { id, type Goal, type Task } from "./index";

const DAY = 86400000;
const due = (t: Task) => (t.dueDate ? Date.parse(t.dueDate) : Infinity);
const open = (t: Task, now: Date) =>
  t.status !== "done" && !t.checkBy && (t.status !== "snoozed" || !t.dueDate || due(t) <= now.getTime());

/** True for a step toward a long-term goal (job hunt, skills). */
export function isLongTerm(t: Task, goals: Goal[]): boolean {
  const g = goals.find((x) => x.id === t.goalId);
  return g ? g.horizon === "long" : t.area === "career" || t.area === "skills";
}

/** Today's plan: at most 3 tasks, nearest deadline first, always including one long-term step when one exists. */
export function planDay(tasks: Task[], goals: Goal[], now = new Date()): Task[] {
  const ready = tasks.filter((t) => open(t, now)).sort((a, b) => due(a) - due(b) || b.priority - a.priority);
  const plan = ready.slice(0, 3);
  if (!plan.some((t) => isLongTerm(t, goals))) {
    const step = ready.find((t) => isLongTerm(t, goals));
    if (step) plan.splice(Math.min(plan.length, 2), 1, step);
  }
  return plan;
}

/** Tasks whose deadline passed more than a day ago: shown as a fresh start, not a wall. */
export function missed(tasks: Task[], now = new Date()): Task[] {
  return tasks.filter((t) => t.status !== "done" && !t.checkBy && t.dueDate && due(t) < now.getTime() - DAY);
}

/** Spreads missed work two per day starting today, so the plan never shows a backlog all at once. */
export function recover(tasks: Task[], now = new Date()): Task[] {
  const late = missed(tasks, now).sort((a, b) => b.priority - a.priority);
  if (!late.length) return tasks;
  const moved = new Map(
    late.map((t, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() + Math.floor(i / 2));
      d.setHours(i < 2 ? 21 : 9, 0, 0, 0);
      // Two come back today (due tonight), so a late return never hides everything again.
      return [t.id, { ...t, status: i < 2 ? ("todo" as const) : ("snoozed" as const), dueDate: d.toISOString(), notes: t.notes || "Carried over" }];
    }),
  );
  return tasks.map((t) => moved.get(t.id) ?? t);
}

export type NowAction = "done" | "later" | "tooBig" | "stuck";

/** Applies a Now-card answer. Returns the updated list. */
export function nowAction(tasks: Task[], task: Task, action: NowAction, now = new Date()): Task[] {
  const swap = (next: Task, extra: Task[] = []) => tasks.flatMap((t) => (t.id === task.id ? [next, ...extra] : [t]));
  if (action === "done") return swap({ ...task, status: "done", completedAt: now.toISOString() });
  if (action === "later") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return swap({ ...task, status: "snoozed", dueDate: task.dueDate && due(task) > d.getTime() ? task.dueDate : d.toISOString() });
  }
  const first: Task = {
    ...task,
    id: id(),
    title: action === "tooBig" ? `First 10 minutes: ${task.title}` : `Write down what's blocking: ${task.title}`,
    notes: "",
    minutes: action === "tooBig" ? 10 : 5,
    priority: Math.min(3, task.priority + 1),
    status: "todo",
    completedAt: undefined,
  };
  return swap({ ...task, priority: Math.max(1, task.priority - 1), minutes: Math.max(task.minutes, 30) }, [first]).sort(
    (a, b) => (a.id === first.id ? -1 : b.id === first.id ? 1 : 0),
  );
}
