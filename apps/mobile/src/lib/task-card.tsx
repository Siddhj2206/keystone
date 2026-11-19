import React, { useState } from "react";
import { Animated, Pressable, View, AccessibilityInfo } from "react-native";
import * as Haptics from "expo-haptics";
import { Task, isISODateString } from "@keystone/core";
import { useStore } from "./store";
import { Card, Label, usePalette } from "./ui";
import { TaskEditor } from './task-editor';
import { taskEditorKey } from './task-draft';
export function TaskCard({
  task,
  number,
  editable = false,
}: {
  task: Task;
  number?: number;
  editable?: boolean;
}): React.JSX.Element {
  const { updateTask, data } = useStore();
  const c = usePalette();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [celebrating, setCelebrating] = useState(false);
  const [scale] = useState(() => new Animated.Value(1));
  const areaColors = {
    academics: "#9c6ce5",
    career: "#eb9168",
    skills: "#4eaec6",
    health: "#73b37f",
    life: "#d994bc",
    other: "#9e99b8",
  };
  const commit = (next: Task): void => {
    updateTask(next).catch((e) => setError(String(e)));
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Card>
        <View
          style={{
            height: 4,
            width: 36,
            borderRadius: 3,
            backgroundColor: areaColors[task.area],
          }}
        />
        {celebrating && (
          <Label style={{ fontWeight: "700", color: c.accent }}>
            ✦ Tiny win. Big energy!
          </Label>
        )}
        <View
          style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}
        >
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={`Mark ${task.title} ${task.status === "done" ? "not done" : "done"}`}
            accessibilityState={{ checked: task.status === "done" }}
            onPress={async () => {
              const next = {
                ...task,
                status:
                  task.status === "done"
                    ? ("todo" as const)
                    : ("done" as const),
                completedAt:
                  task.status === "done" ? undefined : new Date().toISOString(),
              };
              if (next.status === "done") {
                setCelebrating(true);
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                ).catch(() => {});
                if (!(await AccessibilityInfo.isReduceMotionEnabled())) {
                  Animated.sequence([
                    Animated.timing(scale, {
                      toValue: 1.025,
                      duration: 150,
                      useNativeDriver: true,
                    }),
                    Animated.timing(scale, {
                      toValue: 1,
                      duration: 350,
                      useNativeDriver: true,
                    }),
                  ]).start(() => {
                    commit(next);
                    setCelebrating(false);
                  });
                  return;
                }
              }
              commit(next);
              setCelebrating(false);
            }}
            style={{
              width: 28,
              height: 28,
              borderWidth: 1.5,
              borderColor: c.accent,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Label>{task.status === "done" ? "✓" : number || ""}</Label>
          </Pressable>
          <View style={{ flex: 1, gap: 6 }}>
            <Label
              style={{
                fontWeight: "600",
                fontSize: 17,
                textDecorationLine:
                  task.status === "done" ? "line-through" : "none",
              }}
            >
              {task.title}
            </Label>
            <Label style={{ fontSize: 12, color: c.muted }}>
              {task.area.toUpperCase()} · {task.minutes} MIN{" "}
              {task.priority === 3 ? "· HIGH PRIORITY" : ""}
            </Label>
            <Label style={{ fontSize: 12, color: c.muted }}>
              {isISODateString(task.dueDate)
                ? new Date(task.dueDate).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "Whenever you have space"}
              {task.status === "snoozed" ? " · snoozed" : ""}
            </Label>
          </View>
        </View>
        <View
          style={{ flexDirection: "row", justifyContent: "flex-end", gap: 16 }}
        >
          {editable && (
            <Pressable onPress={() => setEditing(!editing)}>
              <Label style={{ fontSize: 12, color: c.accent }}>
                Edit details
              </Label>
            </Pressable>
          )}
          {task.status !== "done" && (
            <Pressable
              accessibilityRole="button"
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
              <Label style={{ fontSize: 12, color: c.muted }}>↗ Tomorrow</Label>
            </Pressable>
          )}
        </View>
        {editing && (
          <TaskEditor key={taskEditorKey(task)} task={task} goals={data.goals} onSave={updateTask} onClose={()=>setEditing(false)}/>
        )}
        {!!error && <Label>{error}</Label>}
      </Card>
    </Animated.View>
  );
}
