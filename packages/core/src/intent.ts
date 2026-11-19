import type { Goal, Task } from "./index";

export type Intent =
  | { kind: "capture" }
  | { kind: "done" | "snooze" | "drop"; query: string }
  | { kind: "question"; topic: "today" | "week" | "next" | "goals" | "unknown" };

const commands: [Intent["kind"], RegExp][] = [
  ["done", /^(?:i\s+)?(?:just\s+)?(?:finished|completed|submitted|done\s+with)\s+(.+)$/i],
  ["done", /^mark\s+(.+?)\s+(?:as\s+)?done$/i],
  ["done", /^(.+?)\s+is\s+done$/i],
  ["snooze", /^(?:move|push|snooze|postpone)\s+(.+?)\s+to\s+tomorrow$|^(?:do|move)\s+(.+?)\s+tomorrow$/i],
  ["drop", /^(?:delete|drop|remove|forget(?:\s+about)?)\s+(.+)$/i],
];

/** Tells a capture apart from a command about an existing task or a question. */
export function classify(text: string): Intent {
  const t = text.trim().replace(/[.!]+$/, "");
  for (const [kind, re] of commands) {
    const m = t.match(re);
    const query = m?.slice(1).find((g) => g?.trim());
    if (m && query) return { kind: kind as "done", query: query.trim() };
  }
  if (/\?$/.test(t) || /^(what|whats|what's|when|which|how many|do i|is there|anything)\b/i.test(t)) {
    const topic = /\btoday\b|right now/i.test(t)
      ? "today"
      : /\bweek\b|\bdue\b|deadline|coming up/i.test(t)
        ? "week"
        : /\bnext\b|should i/i.test(t)
          ? "next"
          : /\bgoals?\b/i.test(t)
            ? "goals"
            : "unknown";
    return { kind: "question", topic };
  }
  return { kind: "capture" };
}

const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
const filler = new Set(["the", "a", "an", "my", "to", "for", "of", "on", "and", "with", "it", "that"]);

/** Best open task for a spoken reference like "the DBMS assignment", or undefined if none is close. */
export function matchTask(query: string, tasks: Task[]): Task | undefined {
  const q = words(query).filter((w) => !filler.has(w));
  if (!q.length) return undefined;
  let best: Task | undefined;
  let score = 0;
  for (const t of tasks) {
    if (t.status === "done") continue;
    const title = new Set(words(t.title));
    const hit = q.filter((w) => title.has(w) || [...title].some((x) => x.length > 3 && (x.startsWith(w) || w.startsWith(x)))).length / q.length;
    const fit = hit - title.size / 1000;
    if (hit >= 0.5 && fit > score) [best, score] = [t, fit];
  }
  return best;
}

const list = (ts: Task[]) => ts.map((t) => t.title).join(", ");

/** Answers a question from local data only. */
export function answer(topic: Extract<Intent, { kind: "question" }>["topic"], tasks: Task[], goals: Goal[], focus: Task[], now = new Date()): string {
  const open = tasks.filter((t) => t.status !== "done");
  if (topic === "week") {
    const end = now.getTime() + 7 * 86400000;
    const due = open.filter((t) => t.dueDate && Date.parse(t.dueDate) <= end).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
    return due.length ? `Due this week: ${list(due)}.` : "Nothing is due in the next 7 days.";
  }
  if (topic === "next") return focus[0] ? `Next: ${focus[0].title}.` : "Nothing is waiting. Add a thought when one comes up.";
  if (topic === "goals") {
    const long = goals.filter((g) => g.horizon === "long");
    return goals.length ? `${goals.length} goals, ${long.length} long-term: ${goals.map((g) => g.title).join(", ")}.` : "No goals yet.";
  }
  if (topic === "today" || focus.length) return focus.length ? `Today: ${list(focus)}.` : "Nothing planned for today.";
  return "I can answer what's next, what's due this week, today's plan and your goals.";
}
