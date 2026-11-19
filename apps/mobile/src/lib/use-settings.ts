import { useState } from "react";
import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { reminderMessage } from "./reminder-message";
import { scheduleReminders } from "./reminders";
import { useStore } from "./store";

export function useSettings() {
  const { data, save, key, setKey } = useStore();
  const [draft, setDraft] = useState(key);
  const [time, setTime] = useState(data.morning);
  const [evening, setEvening] = useState(data.evening);
  const [shown, setShown] = useState({ morning: data.morning, evening: data.evening });
  if (shown.morning !== data.morning || shown.evening !== data.evening) {
    setShown({ morning: data.morning, evening: data.evening });
    setTime(data.morning);
    setEvening(data.evening);
  }
  const [message, setMessage] = useState("");
  async function saveKey() {
    try {
      await setKey(draft.trim());
      setMessage(draft.trim() ? "Key saved in your secure keychain." : "Key removed. Using offline sorting.");
    } catch (e) {
      setMessage(String(e));
    }
  }
  async function removeKey() {
    try {
      await setKey("");
      setDraft("");
      setMessage("Local-only sorting enabled.");
    } catch (e) {
      setMessage(String(e));
    }
  }
  async function saveReminders() {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      setMessage("Enter a valid 24-hour time, like 09:00.");
      return;
    }
    try {
      await save({ ...data, morning: time, evening });
      const ok = await scheduleReminders(data.tasks, time, evening, true);
      setMessage(reminderMessage(ok, Platform.OS));
    } catch (e) {
      setMessage(String(e));
    }
  }
  async function exportData() {
    try {
      const json = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...data }, null, 2);
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = "keystone.json";
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const file = new File(Paths.cache, "keystone.json");
        file.write(json);
        await Sharing.shareAsync(file.uri, { mimeType: "application/json" });
      }
      setMessage("Your export is ready. Keep it somewhere safe.");
    } catch (e) {
      setMessage(String(e));
    }
  }
  return { key, draft, setDraft, time, setTime, evening, setEvening, message, setMessage, saveKey, removeKey, saveReminders, exportData };
}
