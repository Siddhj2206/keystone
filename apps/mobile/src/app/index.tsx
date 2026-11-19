import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { planDay } from "@keystone/core";
import { useStore } from "../lib/store";
import { Button, Card, Label, Page, usePalette } from "../lib/ui";
import { TaskCard } from "../lib/task-card";
import { CheckStack } from "../lib/check-stack";
import { NowCard } from "../lib/now-card";
export default function Today(): React.JSX.Element {
  const { data } = useStore();
  const c = usePalette();
  const now = new Date();
  const focus = planDay(data.tasks, data.goals, now);
  const done = data.tasks.filter((t) => t.status === "done").length;
  const remaining = data.tasks.filter((t) => t.status !== "done");
  const overdue = remaining.filter(
    (t) => t.dueDate && Date.parse(t.dueDate) < now.getTime(),
  );
  const soon = remaining.filter(
    (t) =>
      t.dueDate &&
      Date.parse(t.dueDate) >= now.getTime() &&
      Date.parse(t.dueDate) < now.getTime() + 7 * 86400000,
  );
  const inbox = remaining.filter((t) => !t.goalId);
  return (
    <Page
      eyebrow={now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
      title="A little focus. A lot less noise."
      subtitle="You don't have to do it all. Just the next right thing."
    >
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Label style={{ fontWeight: "600" }}>Your pace, not a race</Label>
          <Label style={{ color: c.accent }}>
            {done} / {data.tasks.length} done
          </Label>
        </View>
        <View style={{ height: 5, backgroundColor: c.line, borderRadius: 8 }}>
          <View
            style={{
              height: 5,
              width: `${data.tasks.length ? (done / data.tasks.length) * 100 : 0}%`,
              backgroundColor: c.accent,
              borderRadius: 8,
            }}
          />
        </View>
        <Label style={{ fontSize: 12, color: c.muted }}>
          Every small step counts. A fresh start is always here.
        </Label>
      </Card>
      <CheckStack />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Label style={{ fontWeight: "700", fontSize: 20 }}>Today’s focus</Label>
        <Label style={{ fontSize: 12, color: c.muted }}>
          JUST {focus.length} THINGS
        </Label>
      </View>
      {focus[0] && <NowCard task={focus[0]} />}
      {focus.slice(1).map((t, i) => (
        <TaskCard key={t.id} task={t} number={i + 2} />
      ))}
      {!focus.length && (
        <Card>
          <Label style={{ fontSize: 22 }}>Room to breathe.</Label>
          <Label style={{ color: c.muted }}>
            Drop in what’s on your mind. We’ll find a place for it.
          </Label>
          <Button
            title="＋  Clear your head"
            onPress={() => router.navigate("/capture")}
          />
        </Card>
      )}
      {overdue.length > 0 && (
        <>
          <Label style={{ fontWeight: "700", fontSize: 20 }}>
            Needs a little attention · {overdue.length}
          </Label>
          {overdue.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </>
      )}
      {soon.length > 0 && (
        <>
          <Label style={{ fontWeight: "700", fontSize: 20 }}>
            Coming up this week
          </Label>
          {soon.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </>
      )}
      {inbox.length > 0 && (
        <>
          <Label style={{ fontWeight: "700", fontSize: 20 }}>
            Inbox · {inbox.length}
          </Label>
          <Label style={{ color: c.muted }}>
            Unsorted doesn’t mean unimportant. Link a goal in details.
          </Label>
          {inbox.map((t) => (
            <TaskCard key={t.id} task={t} editable />
          ))}
        </>
      )}
      {data.captures
        .filter((x) => !x.processed)
        .map((x) => (
          <Card key={x.id}>
            <Label>Saved capture · not processed</Label>
            <Label>{x.text}</Label>
          </Card>
        ))}
    </Page>
  );
}
