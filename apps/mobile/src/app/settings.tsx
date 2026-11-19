import React, { useState } from "react";
import { Platform } from "react-native";
import { EveningToggle } from "../lib/evening-toggle";
import { reminderMessage } from '../lib/reminder-message';
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useStore } from "../lib/store";
import { Button, Card, Input, Label, Page } from "../lib/ui";
import { scheduleReminders } from "../lib/reminders";
import { RestoreButton } from "../lib/restore-button";
export default function Settings(): React.JSX.Element {
  const { data, save, key, setKey } = useStore();
  const [draft, setDraft] = useState(key);
  const [time, setTime] = useState(data.morning);
  const [evening, setEvening] = useState(data.evening);
  const [message, setMessage] = useState("");
  async function exportData(): Promise<void> {
    try {
      const json = JSON.stringify(
        { version: 1, exportedAt: new Date().toISOString(), ...data },
        null,
        2,
      );
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(
          new Blob([json], { type: "application/json" }),
        );
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
  return (
    <Page
      eyebrow="Make it yours"
      title="Less friction. More you."
      subtitle="Private by default. A little help when you want it."
    >
      <Card>
        <Label style={{ fontWeight: "700", fontSize: 20 }}>
          Your data stays with you
        </Label>
        <Label>
          Everything lives in SQLite on this device. No account, no
          subscription, no backend.
        </Label>
      </Card>
      <Card>
        <Label style={{ fontWeight: "700", fontSize: 20 }}>
          Optional Gemini assistant
        </Label>
        <Label>
          Local sorting is always free and offline. Add a free Google AI Studio
          key for smarter sorting. Captures and goal context are then sent to
          Google; free-tier data terms apply. Any error falls back to local
          rules.
        </Label>
        <Input
          accessibilityLabel="Gemini API key"
          placeholder="Paste your Gemini API key"
          secureTextEntry
          value={draft}
          onChangeText={setDraft}
          autoCapitalize="none"
        />
        <Button
          title="Save key securely"
          onPress={() => {
            setKey(draft.trim())
              .then(() =>
                setMessage(
                  draft
                    ? "Key saved in your secure keychain."
                    : "Key removed. Using offline sorting.",
                ),
              )
              .catch((e) => setMessage(String(e)));
          }}
        />
        <Button
          quiet
          title="Remove key · use local only"
          onPress={() => {
            setKey("")
              .then(() => {
                setDraft("");
                setMessage("Local-only sorting enabled.");
              })
              .catch((e) => setMessage(String(e)));
          }}
        />
      </Card>
      <Card>
        <Label style={{ fontWeight: "700", fontSize: 20 }}>
          Gentle check-ins
        </Label>
        <Label>Morning check-in · 24-hour time</Label>
        <Input
          accessibilityLabel="Morning reminder time"
          value={time}
          onChangeText={setTime}
          placeholder="09:00"
        />
        <EveningToggle value={evening} onChange={setEvening} />
        <Button
          title="Save reminders"
          onPress={() => {
            if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
              setMessage("Enter a valid 24-hour time, like 09:00.");
              return;
            }
            save({ ...data, morning: time, evening })
              .then(() => scheduleReminders(data.tasks, time, evening, true))
              .then((ok) =>
                setMessage(reminderMessage(ok,Platform.OS)),
              )
              .catch((e) => setMessage(String(e)));
          }}
        />
        <Label style={{ fontSize: 12 }}>
          No push notifications or APNs. Focus counts reflect your last app
          visit; open Keystone to refresh the schedule.
        </Label>
      </Card>
      <Card>
        <Label style={{ fontWeight: "700", fontSize: 20 }}>
          Take your data with you
        </Label>
        <Label>
          Export goals, tasks, captures and preferences as JSON. Your API key is
          never included. On iPhone, Keystone also saves a weekly backup to
          Files › On My iPhone › Keystone.
        </Label>
        <Button
          quiet
          title="Export all data  ↗"
          onPress={() => void exportData()}
        />
        <RestoreButton onDone={setMessage} />
      </Card>
      {!!message && (
        <Card>
          <Label accessibilityLiveRegion="polite">{message}</Label>
        </Card>
      )}
      <Label style={{ textAlign: "center", fontSize: 12 }}>
        KEYSTONE · A little structure. A lot of possibility.
      </Label>
    </Page>
  );
}
