import React, { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { Button, ContentUnavailableView, Label, List, Section, Text } from "@expo/ui/swift-ui";
import { font, foregroundStyle, listStyle, padding } from "@expo/ui/swift-ui/modifiers";
import { type Task } from "@keystone/core";
import { NativeHost, secondary } from "../native-ui";
import { GoalEditorSheet, GoalProgress, horizonName } from "../native-goal";
import { TaskRow } from "../native-task-row";
import { TaskEditorSheet } from "../task-editor-sheet";
import { taskEditorKey } from "../task-draft";
import { localDateOf } from "../task-dates";
import { useStore } from "../store";

export default function GoalDetail(): React.JSX.Element {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const { data, save, updateTask } = useStore();
  const [editingGoal, setEditingGoal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task>();
  const goal = data.goals.find((g) => g.id === goalId);
  const tasks = data.tasks.filter((t) => t.goalId === goalId);
  const targetDate = localDateOf(goal?.targetDate);
  return (
    <>
      <Stack.Screen options={{ title: "Goal", headerBackTitle: "Goals", headerLargeTitleEnabled: false }} />
      <NativeHost>
        {goal ? (
          <List modifiers={[listStyle("insetGrouped")]}>
            <Section title="Overview">
              <Text modifiers={[font({ textStyle: "title2", weight: "bold" }), padding({ vertical: 5 })]}>{goal.title}</Text>
              <Label title={horizonName[goal.horizon]} systemImage="flag" />
              {!!targetDate && <Label title={`Target: ${new Date(`${targetDate}T12:00:00`).toLocaleDateString(undefined, { dateStyle: "medium" })}`} systemImage="calendar" />}
              <GoalProgress tasks={tasks} />
              {!!goal.notes && <Text modifiers={[padding({ vertical: 4 })]}>{goal.notes}</Text>}
              <Button label="Edit Goal" systemImage="pencil" onPress={() => setEditingGoal(true)} />
            </Section>
            <Section title="Steps">
              {tasks.length ? tasks.map((task) => <TaskRow key={task.id} task={task} onEdit={setEditingTask} />) :
                <Text modifiers={[foregroundStyle(secondary)]}>No tasks yet. Mention this goal in a capture.</Text>}
            </Section>
          </List>
        ) : <ContentUnavailableView title="Goal not found" systemImage="target" />}
        {editingGoal && goal && (
          <GoalEditorSheet goal={goal} onSave={(next) => save({ ...data, goals: data.goals.map((g) => g.id === next.id ? next : g) })} onClose={() => setEditingGoal(false)} />
        )}
        {editingTask && <TaskEditorSheet key={taskEditorKey(editingTask)} task={editingTask} goals={data.goals} onSave={updateTask} onClose={() => setEditingTask(undefined)} />}
      </NativeHost>
    </>
  );
}
