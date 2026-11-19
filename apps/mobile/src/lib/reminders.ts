import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { Task, focusTasks } from "@keystone/core";
export async function scheduleReminders(
  tasks: Task[],
  morning: string,
  evening: boolean,
  request = false,
): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const permission = request
    ? await Notifications.requestPermissionsAsync()
    : await Notifications.getPermissionsAsync();
  if (!permission.granted) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const [hour, minute] = morning.split(":").map(Number);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "A little direction for today",
      body: `${focusTasks(tasks).length} focus picks are waiting. Start with just one.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  if (evening)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Leave today a little lighter",
        body: "A two-minute review: celebrate a win, move anything unfinished.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });
  for (const t of tasks
    .filter(
      (t) =>
        t.status !== "done" && t.dueDate && Date.parse(t.dueDate) > Date.now(),
    )
    .sort((a, b) => Date.parse(a.dueDate!) - Date.parse(b.dueDate!))
    .slice(0, 60))
    await Notifications.scheduleNotificationAsync({
      content: { title: t.title, body: "Your gentle Keystone reminder." },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(t.dueDate!),
      },
    });
  return true;
}
