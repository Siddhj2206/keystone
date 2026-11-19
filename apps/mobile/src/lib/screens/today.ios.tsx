import React, { useState } from "react";
import { Alert, PlatformColor } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, ContentUnavailableView, ContextMenu, HStack, Image, List, Menu, ProgressView, Section, Spacer, SwipeActions, Text, VStack } from "@expo/ui/swift-ui";
import { accessibilityHidden, accessibilityLabel, buttonStyle, contentShape, controlSize, font, foregroundStyle, frame, listRowBackground, listRowInsets, listRowSeparator, listStyle, padding, progressViewStyle, shapes, tint } from "@expo/ui/swift-ui/modifiers";
import { planDay, type Area, type NowAction, type Task } from "@keystone/core";
import { accent, NativeHost, secondary } from "../native-ui";
import { CompletionMark, TaskRow, useCompletion } from "../native-task-row";
import { TaskEditorSheet } from "../task-editor-sheet";
import { taskEditorKey } from "../task-draft";
import { useStore } from "../store";

const areas: Area[] = ["academics", "career", "skills", "health", "life"];
const areaName = (area: Area) => area.charAt(0).toUpperCase() + area.slice(1);

function NowRow({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const { act, data } = useStore();
  const { completing, complete } = useCompletion();
  const goal = data.goals.find((g) => g.id === task.goalId);
  function answer(action: NowAction) {
    if (action === "done") void complete(() => act(task, action));
    else void act(task, action).catch((error) => Alert.alert("Couldn’t update task", String(error)));
  }
  const actions = (
    <>
      <Button label="Not now" systemImage="clock" onPress={() => answer("later")} />
      <Button label="Too big" systemImage="scissors" onPress={() => answer("tooBig")} />
      <Button label="Stuck" systemImage="questionmark.circle" onPress={() => answer("stuck")} />
      <Button label="Edit Task" systemImage="pencil" onPress={onEdit} />
    </>
  );
  return (
    <SwipeActions>
      <ContextMenu>
        <ContextMenu.Trigger>
          <VStack alignment="leading" spacing={10} modifiers={[padding({ vertical: 9 }), contentShape(shapes.rectangle())]}>
            <HStack spacing={6}>
              <Image systemName="timer" size={14} color={accent} />
              <Text modifiers={[font({ textStyle: "subheadline", weight: "semibold" }), foregroundStyle(accent)]}>
                {`${task.minutes} min${goal ? ` · ${goal.title}` : ""}`}
              </Text>
              <Spacer />
              <Menu label={<Image systemName="ellipsis.circle" size={23} color={accent} />} modifiers={[accessibilityLabel("More actions"), padding({ vertical: 5 })]}>
                {actions}
              </Menu>
            </HStack>
            <HStack spacing={5} alignment="center">
              <CompletionMark active={completing} label={`Done: ${task.title}`} onPress={() => answer("done")} />
              <Text modifiers={[font({ textStyle: "title2", weight: "semibold" }), frame({ maxWidth: Infinity, alignment: "leading" })]}>
                {task.title}
              </Text>
            </HStack>
          </VStack>
        </ContextMenu.Trigger>
        <ContextMenu.Items>
          <Button label="Complete" systemImage="checkmark" onPress={() => answer("done")} />
          {actions}
        </ContextMenu.Items>
      </ContextMenu>
      <SwipeActions.Actions edge="leading">
        <Button label="Complete" systemImage="checkmark" onPress={() => answer("done")} modifiers={[tint(PlatformColor("systemGreen"))]} />
      </SwipeActions.Actions>
      <SwipeActions.Actions edge="trailing" allowsFullSwipe={false}>
        <Button label="Not now" systemImage="clock" onPress={() => answer("later")} modifiers={[tint(accent)]} />
      </SwipeActions.Actions>
    </SwipeActions>
  );
}

export default function Today(): React.JSX.Element {
  const { data, resolveCheck, updateTask } = useStore();
  const { bottom } = useSafeAreaInsets();
  const [editing, setEditing] = useState<Task>();
  const now = new Date();
  const focus = planDay(data.tasks, data.goals, now);
  const remaining = data.tasks.filter((t) => t.status !== "done");
  const completed = data.tasks.length - remaining.length;
  const pending = remaining.filter((t) => t.checkBy);
  const [check] = pending;
  const overdue = remaining.filter((t) => t.dueDate && Date.parse(t.dueDate) < now.getTime());
  const soon = remaining.filter((t) => t.dueDate && Date.parse(t.dueDate) >= now.getTime() && Date.parse(t.dueDate) < now.getTime() + 7 * 86400000);
  const noGoal = remaining.filter((t) => !t.goalId);
  const inbox = noGoal.filter((t) => t.area === "other" || t.checkBy);
  const byArea = [...new Set(noGoal.filter((t) => !t.checkBy).map((t) => t.area))].filter((area) => area !== "other");
  const unprocessed = data.captures.filter((capture) => !capture.processed);
  const allDone = completed > 0 && !remaining.length && !unprocessed.length;
  const rows = (tasks: Task[]) => tasks.map((task) => <TaskRow key={task.id} task={task} onEdit={setEditing} />);

  function review(area?: Area) {
    if (check) void resolveCheck(check, area).catch((error) => Alert.alert("Couldn’t confirm task", String(error)));
  }
  return (
    <NativeHost>
      <List modifiers={[listStyle("insetGrouped")]}>
        <Text modifiers={[
          font({ textStyle: "subheadline", weight: "semibold" }),
          foregroundStyle(secondary), listRowBackground("transparent"), listRowSeparator("hidden"),
          listRowInsets({ top: 0, bottom: 0, leading: 0, trailing: 0 }),
        ]}>{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</Text>
        <Section title={focus.length ? "Up next" : undefined}>
          {focus[0] ? <NowRow key={focus[0].id} task={focus[0]} onEdit={() => setEditing(focus[0])} /> :
            <ContentUnavailableView
              title={allDone ? "All done for today" : remaining.length ? "Nothing on deck" : "A fresh start"}
              systemImage={allDone ? "checkmark.seal.fill" : "sun.max"}
              description={allDone ? "You cleared your list. Enjoy the space you made." : remaining.length ? "You can pick up the items below when you’re ready." : "Capture what’s on your mind to get started."}
              actions={<Button label="New Capture" systemImage="plus" onPress={() => router.navigate("/capture")} modifiers={[buttonStyle("bordered")]} />}
            />}
        </Section>
        {check && (
          <Section title={`Check · ${pending.length}`} footer={<Text>Keystone keeps its guess if you skip this.</Text>}>
            <VStack alignment="leading" spacing={7} modifiers={[padding({ vertical: 6 })]}>
              <Text modifiers={[font({ textStyle: "headline" })]}>{check.title}</Text>
              <Text modifiers={[font({ textStyle: "subheadline" }), foregroundStyle(secondary)]}>
                {`Suggested area: ${areaName(check.area)}`}
              </Text>
              <HStack spacing={12}>
                <Button label="Looks Right" onPress={() => review()} modifiers={[buttonStyle("bordered"), controlSize("regular")]} />
                <Menu label="Change Area" modifiers={[buttonStyle("borderless")]}>
                  {areas.map((area) => <Button key={area} label={areaName(area)} onPress={() => review(area)} />)}
                </Menu>
              </HStack>
            </VStack>
          </Section>
        )}
        {focus.length > 1 && <Section title="Also in focus">{rows(focus.slice(1))}</Section>}
        {overdue.length > 0 && <Section title="Overdue">{rows(overdue)}</Section>}
        {soon.length > 0 && <Section title="This week">{rows(soon)}</Section>}
        {inbox.length > 0 && <Section title="Inbox">{rows(inbox)}</Section>}
        {byArea.map((area) => (
          <Section key={area} title={`${areaName(area)} · No goal yet`}>
            {rows(noGoal.filter((task) => task.area === area))}
          </Section>
        ))}
        {unprocessed.length > 0 && <Section title="Saved for processing">
          {unprocessed.map((capture) => <Text key={capture.id}>{capture.text}</Text>)}
        </Section>}
        {data.tasks.length > 0 && !allDone && <Section title="Progress">
          <ProgressView value={completed / data.tasks.length} modifiers={[progressViewStyle("linear")]}>
            <Text>{`${completed} of ${data.tasks.length} tasks complete`}</Text>
          </ProgressView>
        </Section>}
        <Spacer minLength={bottom} modifiers={[listRowBackground("transparent"), listRowSeparator("hidden"), accessibilityHidden(true)]} />
      </List>
      {editing && <TaskEditorSheet key={taskEditorKey(editing)} task={editing} goals={data.goals} onSave={updateTask} onClose={() => setEditing(undefined)} />}
    </NativeHost>
  );
}
