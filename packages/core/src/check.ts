import type { Area, Task } from "./index";

export const CHECK_HOURS = 48;
const stop = new Set(["the", "and", "for", "with", "from", "this", "that", "about", "into", "some", "next", "week", "today", "tomorrow"]);

/** Learned area corrections, keyed by a lower-case word from the task title. */
export type Rules = Record<string, Area>;

/** The word a correction is remembered by: the longest meaningful word in the title. */
export function ruleWord(title: string): string | undefined {
  return (title.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((w) => w.length >= 3 && !stop.has(w) && !/^\d+$/.test(w))
    .sort((a, b) => b.length - a.length)[0];
}

/** Applies learned corrections, and sends guesses Keystone isn't sure about to the Check stack. */
export function triage(tasks: Task[], rules: Rules = {}, now = new Date()): Task[] {
  return tasks.map((t) => {
    const learned = (t.title.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => Object.prototype.hasOwnProperty.call(rules, w)).map((w) => rules[w])[0];
    if (learned) return { ...t, area: learned };
    if (t.area !== "other") return t;
    return { ...t, checkBy: new Date(now.getTime() + CHECK_HOURS * 3600000).toISOString() };
  });
}

/** Keeps the guess for tasks whose Check time has passed. */
export function autoAccept(tasks: Task[], now = new Date()): Task[] {
  return tasks.some((t) => t.checkBy && Date.parse(t.checkBy) <= now.getTime())
    ? tasks.map((t) => (t.checkBy && Date.parse(t.checkBy) <= now.getTime() ? { ...t, checkBy: undefined } : t))
    : tasks;
}
