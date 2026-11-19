import React, { useState } from "react";
import { Picker, ProgressView, Section, Text, VStack } from "@expo/ui/swift-ui";
import { font, foregroundStyle, padding, progressViewStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { id, type Goal, type Task } from "@keystone/core";
import { NativeField, secondary } from "./native-ui";
import { EditorSheet, OptionalDate } from "./task-editor-sheet";
import { localDateOf } from "./task-dates";

export const horizonName = { short: "Short term", long: "Long term" } as const;

export function GoalProgress({ tasks }: { tasks: Task[] }) {
  const done = tasks.filter((task) => task.status === "done").length;
  return (
    <VStack alignment="leading" spacing={6} modifiers={[padding({ top: 4 })]}>
      <ProgressView value={done / Math.max(tasks.length, 1)} modifiers={[progressViewStyle("linear")]} />
      <Text modifiers={[font({ textStyle: "caption" }), foregroundStyle(secondary)]}>
        {`${done} of ${tasks.length} steps complete`}
      </Text>
    </VStack>
  );
}

export function GoalEditorSheet({ goal, onSave, onClose }: {
  goal?: Goal;
  onSave: (goal: Goal) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Goal>(() => goal ?? {
    id: id(), title: "", area: "other", horizon: "long", notes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function persist() {
    setSaving(true);
    try {
      await onSave(goal ? draft : { ...draft, title: draft.title.trim() });
      onClose();
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  }
  return (
    <EditorSheet title={goal ? "Edit Goal" : "New Goal"} onSave={() => void persist()} onClose={onClose} saveDisabled={saving || !draft.title.trim()}>
      <Section title="Details">
        <NativeField placeholder="Goal title" value={draft.title} onChange={(title) => setDraft((d) => ({ ...d, title }))} />
        <NativeField placeholder="Notes" axis="vertical" value={draft.notes} onChange={(notes) => setDraft((d) => ({ ...d, notes }))} />
      </Section>
      <Section title="Timing">
        <Picker label="Horizon" selection={draft.horizon} onSelectionChange={(horizon: Goal["horizon"]) => setDraft((d) => ({ ...d, horizon }))}>
          <Text modifiers={[tag("short")]}>{horizonName.short}</Text>
          <Text modifiers={[tag("long")]}>{horizonName.long}</Text>
        </Picker>
        <OptionalDate title="Target date" value={localDateOf(draft.targetDate)} onChange={(targetDate) => setDraft((d) => ({ ...d, targetDate: targetDate || undefined }))} />
      </Section>
      {!!error && <Section><Text>{error}</Text></Section>}
    </EditorSheet>
  );
}
