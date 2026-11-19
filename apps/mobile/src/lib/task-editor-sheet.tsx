import React, { useState } from "react";
import { BottomSheet, Button, DatePicker, Form, Group, LabeledContent, NavigationStack, Picker, Section, Text, Toggle, Toolbar, ToolbarItem } from "@expo/ui/swift-ui";
import { accessibilityLabel, datePickerStyle, disabled, keyboardType, multilineTextAlignment, navigationBarTitleDisplayMode, navigationTitle, presentationDetents, presentationDragIndicator, tag } from "@expo/ui/swift-ui/modifiers";
import { isISODateString, type Goal, type Task } from "@keystone/core";
import { NativeField } from "./native-ui";
import { localDateOf, withDueTime } from "./task-dates";
import { applyTaskDraft, taskDraft } from "./task-draft";

export function EditorSheet({ title, children, onSave, onClose, saveDisabled, compact }: {
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  onClose: () => void;
  saveDisabled: boolean;
  compact?: boolean;
}) {
  return (
    <BottomSheet
      isPresented
      onIsPresentedChange={(open) => { if (!open) onClose(); }}
    >
      <Group modifiers={[presentationDetents(compact ? ["medium", "large"] : ["large"]), presentationDragIndicator("visible")]}>
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
      </Group>
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
  const [dueTime, setDueTime] = useState<Date>();
  const [priority, setPriority] = useState(task.priority);
  const [estimate, setEstimate] = useState(String(task.minutes));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const minutes = Number(estimate);
  const validEstimate = /^\d+$/.test(estimate) && Number.isSafeInteger(minutes) && minutes > 0;
  const originalTime = isISODateString(task.dueDate) && task.dueDate.includes("T") ? new Date(task.dueDate) : undefined;
  const dueDate = draft.date ? withDueTime(draft.date, dueTime ?? originalTime) : undefined;
  async function persist() {
    setSaving(true);
    try {
      const edited = applyTaskDraft(task, draft);
      await onSave({ ...edited, dueDate: dueTime || draft.date !== localDateOf(task.dueDate) ? dueDate : edited.dueDate, priority, minutes });
      onClose();
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  }
  return (
    <EditorSheet compact title="Edit Task" onSave={() => void persist()} onClose={onClose} saveDisabled={saving || !draft.title.trim() || !validEstimate}>
      <Section title="Details">
        <NativeField value={draft.title} onChange={(title) => setDraft((d) => ({ ...d, title }))} placeholder="Task title" />
        <NativeField value={draft.notes} onChange={(notes) => setDraft((d) => ({ ...d, notes }))} placeholder="Notes" axis="vertical" />
      </Section>
      <Section title="Planning">
        <OptionalDate title="Due date" value={draft.date} onChange={(date) => setDraft((d) => ({ ...d, date }))} />
        {!!dueDate && <DatePicker title="Time" selection={new Date(dueDate)} displayedComponents={["hourAndMinute"]} onDateChange={setDueTime} modifiers={[datePickerStyle("compact")]} />}
        <Picker label="Priority" selection={priority} onSelectionChange={setPriority}>
          <Text modifiers={[tag(1)]}>Low</Text>
          <Text modifiers={[tag(2)]}>Normal</Text>
          <Text modifiers={[tag(3)]}>High</Text>
        </Picker>
        <LabeledContent label="Estimate (min)">
          <NativeField value={estimate} onChange={setEstimate} placeholder="Minutes" modifiers={[keyboardType("numeric"), multilineTextAlignment("trailing"), accessibilityLabel("Estimate in minutes")]} />
        </LabeledContent>
        <Picker label="Goal" selection={draft.goalId ?? ""} onSelectionChange={(goalId: string) => {
          const goal = goals.find((g) => g.id === goalId);
          setDraft((d) => ({ ...d, goalId: goal?.id, area: goal?.area ?? d.area }));
        }}>
          <Text modifiers={[tag("")]}>None</Text>
          {goals.map((goal) => <Text key={goal.id} modifiers={[tag(goal.id)]}>{goal.title}</Text>)}
        </Picker>
      </Section>
      {!validEstimate && <Section><Text>Enter a positive estimate in minutes.</Text></Section>}
      {!!error && <Section><Text>{error}</Text></Section>}
    </EditorSheet>
  );
}
