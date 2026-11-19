import React, { useState } from "react";
import { Animated, Pressable, View, AccessibilityInfo } from "react-native";
import * as Haptics from "expo-haptics";
import { Task, isISODateString } from "@keystone/core";
import { useStore } from "./store";
import { Card, Label, usePalette } from "./ui";
import { useLook } from "./use-look";
import { AreaIcon } from "./area-icon";
import { TaskEditor } from "./task-editor";
import { taskEditorKey } from "./task-draft";
export function TaskCard({
  task,
  number,
  editable = true,
}: {
  task: Task;
  number?: number;
  editable?: boolean;
}): React.JSX.Element {
  const { updateTask, data } = useStore();
  const c = usePalette();
  const { look } = useLook();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [scale] = useState(() => new Animated.Value(1));
  const commit = (next: Task): void => {
    updateTask(next).catch((e) => setError(String(e)));
  };
  async function toggle(): Promise<void> {
    if (saving) return;
    setSaving(true);
    try {
      const next = {
        ...task,
        status: task.status === "done" ? ("todo" as const) : ("done" as const),
        completedAt:
          task.status === "done" ? undefined : new Date().toISOString(),
      };
      if (next.status === "done") {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
        if (!(await AccessibilityInfo.isReduceMotionEnabled()))
          await new Promise<void>((resolve) =>
            Animated.sequence([
              Animated.spring(scale, {
                toValue: look === "b" ? 1.04 : 1.015,
                speed: 24,
                bounciness: look === "b" ? 14 : 3,
                useNativeDriver: true,
              }),
              Animated.spring(scale, {
                toValue: 1,
                speed: 24,
                bounciness: 8,
                useNativeDriver: true,
              }),
            ]).start(() => resolve()),
          );
      }
      await updateTask(next);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }
  const due = isISODateString(task.dueDate)
    ? new Date(task.dueDate).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "No deadline";
  const checkbox = (
    <Pressable
      disabled={saving}
      role="checkbox"
      aria-checked={task.status === "done"}
      accessibilityLabel={`Mark ${task.title} ${task.status === "done" ? "not done" : "done"}`}
      accessibilityState={{ checked: task.status === "done", disabled: saving }}
      onPress={() => void toggle()}
      style={{
        width: look === "b" ? 32 : 24,
        height: look === "b" ? 32 : 24,
        borderWidth: 1,
        borderColor: look === "b" ? c.area[task.area] : c.line,
        borderRadius: look === "b" ? 11 : look === "c" ? 12 : 6,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: task.status === "done" ? c.accent : "transparent",
      }}
    >
      <Label
        style={{
          fontSize: look === "b" ? 21 : 14,
          color: task.status === "done" ? c.accentInk : c.muted,
        }}
      >
        {task.status === "done" ? "✓" : look === "b" ? "+" : ""}
      </Label>
    </Pressable>
  );
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Card
        area={task.area}
        style={
          look === "c"
            ? {
                backgroundColor: "transparent",
                borderWidth: 0,
                borderBottomWidth: 1,
                paddingHorizontal: 0,
                paddingVertical: 16,
                borderRadius: 0,
              }
            : look === "a"
              ? { padding: 12, gap: 8 }
              : undefined
        }
      >
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <AreaIcon area={task.area} />
          <View style={{ flex: 1, gap: 2 }}>
            {look === "b" && (
              <Label
                style={{
                  fontSize: 9,
                  letterSpacing: 1.2,
                  color: c.area[task.area],
                  fontWeight: "700",
                }}
              >
                {task.area.toUpperCase()}
              </Label>
            )}
            <Label
              style={{
                fontFamily: look === "a" ? undefined : c.display,
                fontSize: look === "a" ? 14 : look === "b" ? 20 : 22,
                lineHeight: look === "a" ? 20 : 26,
                fontWeight: look === "a" ? "500" : "400",
                textDecorationLine:
                  task.status === "done" ? "line-through" : "none",
              }}
            >
              {task.title}
            </Label>
            {look !== "b" && (
              <Label style={{ fontSize: 11, color: c.muted }}>
                {task.area}{" "}
                <Label style={{ fontSize: 10, color: c.muted }}>
                  · {task.minutes} min
                </Label>
              </Label>
            )}
          </View>
          {checkbox}
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginLeft: look === "a" ? 44 : look === "c" ? 22 : 0,
          }}
        >
          <Label
            style={{
              fontSize: 10,
              color:
                task.priority === 3 && look === "a"
                  ? c.area[task.area]
                  : c.muted,
            }}
          >
            {task.priority === 3 ? "• " : ""}
            {due}
            {look === "b" ? ` · ${task.minutes} min` : ""}
            {task.status === "snoozed" ? " · snoozed" : ""}
          </Label>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            {editable && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${task.title}`}
                hitSlop={8}
                onPress={() => setEditing(!editing)}
              >
                <Label style={{ fontSize: 10, color: c.muted }}>
                  {editing ? "Close" : "Details"}
                </Label>
              </Pressable>
            )}
            {task.status !== "done" && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Snooze ${task.title} to tomorrow`}
                hitSlop={8}
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(9, 0, 0, 0);
                  commit({
                    ...task,
                    status: "snoozed",
                    dueDate: tomorrow.toISOString(),
                  });
                }}
              >
                <Label style={{ fontSize: 10, color: c.muted }}>↗</Label>
              </Pressable>
            )}
            {look === "a" && number && (
              <Label
                style={{
                  fontSize: 9,
                  color: c.muted,
                  borderWidth: 1,
                  borderColor: c.line,
                  borderRadius: 3,
                  paddingHorizontal: 4,
                  lineHeight: 15,
                }}
              >
                {number}
              </Label>
            )}
          </View>
        </View>
        {editing && (
          <TaskEditor
            key={taskEditorKey(task)}
            task={task}
            goals={data.goals}
            onSave={updateTask}
            onClose={() => setEditing(false)}
          />
        )}
        {!!error && <Label accessibilityLiveRegion="polite">{error}</Label>}
      </Card>
    </Animated.View>
  );
}
