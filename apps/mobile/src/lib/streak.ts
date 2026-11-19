import { Task } from "@keystone/core";
export function streakOf(tasks: Task[], now = new Date()): number {
  const days = new Set(
    tasks
      .filter((t) => t.status === "done" && t.completedAt)
      .map((t) => new Date(t.completedAt!).toDateString()),
  );
  const date = new Date(now);
  let streak = 0;
  if (!days.has(date.toDateString())) date.setDate(date.getDate() - 1);
  while (days.has(date.toDateString())) {
    streak++;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}
