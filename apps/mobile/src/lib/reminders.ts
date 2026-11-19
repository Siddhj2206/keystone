import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { Task, Goal, planDay } from "@keystone/core";
let pending = Promise.resolve();
export function scheduleReminders(tasks:Task[],morning:string,evening:boolean,request=false,goals:Goal[]=[]):Promise<boolean> {
  const result = pending.then(()=>replaceReminders(tasks,morning,evening,request,goals));
  pending = result.then(()=>{},()=>{});
  return result;
}
async function replaceReminders(
  tasks: Task[],
  morning: string,
  evening: boolean,
  request = false,
  goals:Goal[] = [],
): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const permission = request
    ? await Notifications.requestPermissionsAsync()
    : await Notifications.getPermissionsAsync();
  if (!permission.granted) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const [hour, minute] = morning.split(":").map(Number);
  await Notifications.scheduleNotificationAsync({
    identifier: 'keystone-morning',
    content: {
      title: "A little direction for today",
      body: `${planDay(tasks,goals).length} focus picks are waiting. Start with just one.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  if (evening)
    await Notifications.scheduleNotificationAsync({
      identifier: 'keystone-evening',
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
      identifier: `keystone-task-${t.id}`,
      content: { title: t.title, body: "Your gentle Keystone reminder." },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(t.dueDate!),
      },
    });
  return true;
}
