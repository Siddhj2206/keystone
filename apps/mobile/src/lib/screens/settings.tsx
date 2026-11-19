import React from "react";
import { EveningToggle } from "../evening-toggle";
import { Button, Card, Input, Label, Page } from "../ui";
import { RestoreButton } from "../restore-button";
import { useSettings } from "../use-settings";
export default function Settings(): React.JSX.Element {
  const { draft, setDraft, time, setTime, evening, setEvening, message, setMessage, saveKey, removeKey, saveReminders, exportData } = useSettings();
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
          onPress={() => void saveKey()}
        />
        <Button
          quiet
          title="Remove key · use local only"
          onPress={() => void removeKey()}
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
          onPress={() => void saveReminders()}
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
