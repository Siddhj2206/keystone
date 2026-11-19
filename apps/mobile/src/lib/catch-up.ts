import { Capture, organize } from "@keystone/core";
import type { createStateQueue } from "./state-queue";
import type { Data } from "./store";
import { backupDue, writeBackup } from "./backup";

type State = ReturnType<typeof createStateQueue<Data>>;

/** Sorts a saved capture into tasks and goals and marks it processed. */
const sorting = new Set<string>();
export async function sortCapture(state: State, item: Capture, key: string) {
  sorting.add(item.id);
  try {
    const plan = await organize(item, state.get().goals, key);
    await state.update((latest) =>
      latest.captures.some((c) => c.id === item.id && !c.processed)
        ? {
            ...latest,
            tasks: [...latest.tasks, ...plan.tasks],
            goals: [...latest.goals, ...plan.goals],
            captures: latest.captures.map((c) => (c.id === item.id ? { ...c, processed: true } : c)),
          }
        : latest,
    );
    return plan;
  } finally {
    sorting.delete(item.id);
  }
}

let retrying = false;
/** Re-sorts captures that were saved but never organized (app closed or sort failed). */
export async function retryCaptures(state: State, key: string): Promise<void> {
  if (retrying) return;
  retrying = true;
  try {
    for (const item of state.get().captures.filter((c) => !c.processed && !sorting.has(c.id)))
      await sortCapture(state, item, key).catch(() => {});
  } finally {
    retrying = false;
  }
}

export async function autoBackup(state: State, now = new Date()): Promise<void> {
  const latest = state.get();
  if (!backupDue(latest.lastBackupAt, now)) return;
  try {
    if (!writeBackup(latest, now)) return;
    await state.update((l) => ({ ...l, lastBackupAt: now.toISOString() }));
  } catch {}
}
