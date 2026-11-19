import React, { useState } from "react";
import { BottomSheet, Button, DatePicker, Form, NavigationStack, Picker, Section, Text, Toggle, Toolbar, ToolbarItem } from "@expo/ui/swift-ui";
import { datePickerStyle, disabled, navigationBarTitleDisplayMode, navigationTitle, presentationDetents, presentationDragIndicator, tag } from "@expo/ui/swift-ui/modifiers";
import type { Goal, Task } from "@keystone/core";
import { NativeField } from "./native-ui";
import { localDateOf } from "./task-dates";
import { applyTaskDraft, taskDraft } from "./task-draft";

export function EditorSheet({ title, children, onSave, onClose, saveDisabled }: {
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  onClose: () => void;
  saveDisabled: boolean;
}) {
  return (
    <BottomSheet
      isPresented
      onIsPresentedChange={(open) => { if (!open) onClose(); }}
      modifiers={[presentationDetents(["large"]), presentationDragIndicator("visible")]}
    >
      <NavigationStack>
        <Toolbar>
          <Form modifiers={[navigationTitle(title), navigationBarTitleDisplayMode("inline")]}>
            {children}
          </Form>
          <Toolbar.Content>
            <ToolbarItem placement="cancellationAction">
              <Button label="Cancel" onPress={onClose} />
            </ToolbarItem>
            <ToolbarItem placement="confirmationAction">
              <Button label="Save" onPress={onSave} modifiers={[disabled(saveDisabled)]} />
            </ToolbarItem>
          </Toolbar.Content>
        </Toolbar>
      </NavigationStack>
    </BottomSheet>
  );
}

export function OptionalDate({ title, value, onChange }: {
  title: string;
  value: string;
  onChange: (date: string) => void;
}) {
  return (
    <>
      <Toggle label={title} isOn={!!value} onIsOnChange={(on) => onChange(on ? localDateOf(new Date().toISOString()) : "")} />
      {!!value && <DatePicker
        title="Date"
        selection={new Date(`${value}T12:00:00`)}
        displayedComponents={["date"]}
        onDateChange={(date) => onChange(localDateOf(date.toISOString()))}
        modifiers={[datePickerStyle("compact")]}
      />}
    </>
  );
}

export function TaskEditorSheet({ task, goals, onSave, onClose }: {
  task: Task;
  goals: Goal[];
  onSave: (task: Task) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => taskDraft(task));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function persist() {
    setSaving(true);
    try {
      await onSave(applyTaskDraft(task, draft));
      onClose();
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  }
  return (
    <EditorSheet title="Edit Task" onSave={() => void persist()} onClose={onClose} saveDisabled={saving || !draft.title.trim()}>
      <Section title="Details">
        <NativeField value={draft.title} onChange={(title) => setDraft((d) => ({ ...d, title }))} placeholder="Task title" />
        <NativeField value={draft.notes} onChange={(notes) => setDraft((d) => ({ ...d, notes }))} placeholder="Notes" axis="vertical" />
      </Section>
      <Section title="Planning">
        <OptionalDate title="Due date" value={draft.date} onChange={(date) => setDraft((d) => ({ ...d, date }))} />
        <Picker label="Goal" selection={draft.goalId ?? ""} onSelectionChange={(goalId: string) => {
          const goal = goals.find((g) => g.id === goalId);
          setDraft((d) => ({ ...d, goalId: goal?.id, area: goal?.area ?? d.area }));
        }}>
          <Text modifiers={[tag("")]}>None</Text>
          {goals.map((goal) => <Text key={goal.id} modifiers={[tag(goal.id)]}>{goal.title}</Text>)}
        </Picker>
      </Section>
      {!!error && <Section><Text>{error}</Text></Section>}
    </EditorSheet>
  );
}
