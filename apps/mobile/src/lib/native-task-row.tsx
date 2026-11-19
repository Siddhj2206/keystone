import React, { useRef, useState } from "react";
import { Alert, AccessibilityInfo, PlatformColor } from "react-native";
import * as Haptics from "expo-haptics";
import { Button, ContextMenu, HStack, Image, Spacer, SwipeActions, Text, VStack } from "@expo/ui/swift-ui";
import { Animation, accessibilityLabel, animation, buttonStyle, contentShape, font, foregroundStyle, frame, padding, scaleEffect, shapes, strikethrough, tint } from "@expo/ui/swift-ui/modifiers";
import { isISODateString, type Task } from "@keystone/core";
import { accent, secondary } from "./native-ui";
import { useStore } from "./store";

export function useCompletion() {
  const [completing, setCompleting] = useState(false);
  const pending = useRef(false);
  async function complete(commit: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (!(await AccessibilityInfo.isReduceMotionEnabled())) {
        setCompleting(true);
        await new Promise((resolve) => setTimeout(resolve, 225));
      }
      await commit();
    } catch (error) {
      Alert.alert("Couldn’t complete task", String(error));
    } finally {
      setCompleting(false);
      pending.current = false;
    }
  }
  return { completing, complete };
}

export function CompletionMark({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Button onPress={onPress} modifiers={[buttonStyle("borderless"), accessibilityLabel(label)]}>
      <Image
        systemName={active ? "checkmark.circle.fill" : "circle"}
        size={23}
        color={accent}
        modifiers={[frame({ width: 44, height: 44 }), scaleEffect(active ? 1.12 : 1), animation(Animation.snappy({ duration: 0.23 }), active)]}
      />
    </Button>
  );
}

export function TaskRow({ task, onEdit }: { task: Task; onEdit: (task: Task) => void }) {
  const { updateTask } = useStore();
  const { completing, complete } = useCompletion();
  const done = task.status === "done";
  const stateLabel = done ? "Mark incomplete" : "Complete";
  const date = isISODateString(task.dueDate)
    ? new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : undefined;
  function save(next: Task) {
    return updateTask(next).catch((error) => Alert.alert("Couldn’t update task", String(error)));
  }
  function toggle() {
    if (done) void save({ ...task, status: "todo", completedAt: undefined });
    else void complete(() => updateTask({ ...task, status: "done", completedAt: new Date().toISOString() }));
  }
  function snooze() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    void save({ ...task, status: "snoozed", dueDate: tomorrow.toISOString() });
  }
  return (
    <SwipeActions>
      <ContextMenu>
        <ContextMenu.Trigger>
          <HStack spacing={3} modifiers={[contentShape(shapes.rectangle())]}>
            <CompletionMark active={done || completing} label={`${stateLabel}: ${task.title}`} onPress={toggle} />
            <Button onPress={() => onEdit(task)} modifiers={[buttonStyle("plain"), frame({ maxWidth: Infinity, alignment: "leading" })]}>
              <HStack spacing={10} modifiers={[padding({ vertical: 6 }), frame({ maxWidth: Infinity, alignment: "leading" }), contentShape(shapes.rectangle())]}>
                <VStack alignment="leading" spacing={3}>
                  <Text modifiers={[font({ textStyle: "body" }), strikethrough({ isActive: done, pattern: "solid" })]}>{task.title}</Text>
                  <Text modifiers={[font({ textStyle: "caption" }), foregroundStyle(secondary)]}>
                    {[`${task.minutes} min`, date, task.status === "snoozed" ? "Snoozed" : undefined, task.priority === 3 ? "High priority" : undefined].filter(Boolean).join(" · ")}
                  </Text>
                </VStack>
                <Spacer />
                <Image systemName="chevron.right" size={11} modifiers={[foregroundStyle(secondary)]} />
              </HStack>
            </Button>
          </HStack>
        </ContextMenu.Trigger>
        <ContextMenu.Items>
          <Button label="Edit Task" systemImage="pencil" onPress={() => onEdit(task)} />
          <Button label={stateLabel} systemImage={done ? "circle" : "checkmark"} onPress={toggle} />
          {!done && <Button label="Snooze until tomorrow" systemImage="clock" onPress={snooze} />}
        </ContextMenu.Items>
      </ContextMenu>
      <SwipeActions.Actions edge="leading">
        <Button label={stateLabel} systemImage={done ? "circle" : "checkmark"} onPress={toggle} modifiers={[tint(PlatformColor("systemGreen"))]} />
      </SwipeActions.Actions>
      {!done && <SwipeActions.Actions edge="trailing" allowsFullSwipe={false}>
        <Button label="Snooze" systemImage="clock" onPress={snooze} modifiers={[tint(accent)]} />
      </SwipeActions.Actions>}
    </SwipeActions>
  );
}
