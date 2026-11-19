import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { focusTasks } from "@keystone/core";
import { useStore } from "../lib/store";
import { Button, Card, Label, Page, usePalette, Display } from "../lib/ui";
import { TaskCard } from "../lib/task-card";
import { useLook } from "../lib/use-look";
import { streakOf } from "../lib/streak";
export default function Today(): React.JSX.Element {
  const { data } = useStore();
  const c = usePalette();
  const { look } = useLook();
  const now = new Date();
  const focus = focusTasks(data.tasks);
  const done = data.tasks.filter((t) => t.status === "done").length;
  const focusIds = new Set(focus.map((t) => t.id));
  const remaining = data.tasks.filter(
    (t) => t.status !== "done" && !focusIds.has(t.id),
  );
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
      title={
        look === "a"
          ? "Your day, distilled."
          : look === "b"
            ? "Small wins.\nBig energy."
            : "Make space for\nwhat matters."
      }
      subtitle={
        look === "a"
          ? "A few good priorities. Everything else can wait."
          : look === "b"
            ? "A little progress looks good on you."
            : "Not everything needs your attention today."
      }
    >
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Label style={{ fontWeight: "500", fontSize: 12 }}>
            {look === "b"
              ? `🔥 ${streakOf(data.tasks)} day streak`
              : look === "c"
                ? "A gentle measure of progress"
                : "A little momentum"}
          </Label>
          <Label style={{ color: c.accent }}>
            <Label style={{ fontSize: 12, color: c.accent }}>
              {done} / {data.tasks.length} done
            </Label>
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
          {look === "b"
            ? "One tiny win is still a win. You’ve got this!"
            : look === "c"
              ? "Slow is a perfectly good speed."
              : "One thing at a time is a strategy."}
        </Label>
      </Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Display
          style={{
            fontSize: look === "a" ? 14 : 22,
            lineHeight: 28,
            fontWeight: look === "a" ? "600" : "400",
          }}
        >
          Today’s focus
        </Display>
        <Label style={{ fontSize: 12, color: c.muted }}>
          {look === "c"
            ? `${String(focus.length).padStart(2, "0")} priorities`
            : `TOP ${focus.length} PICKS`}
        </Label>
      </View>
      {focus.map((t, i) => (
        <TaskCard key={t.id} task={t} number={i + 1} />
      ))}
      {!focus.length && (
        <Card>
          <Label style={{ fontSize: 22 }}>Room to breathe.</Label>
          <Label style={{ color: c.muted }}>
            Drop in what’s on your mind. We’ll find a place for it.
          </Label>
          <Button
            title="+  Clear your head"
            onPress={() => router.navigate("/capture")}
          />
        </Card>
      )}
      {!!focus.length && (
        <Button
          quiet
          title={
            look === "a"
              ? "+ Capture a thought"
              : look === "b"
                ? "+ Got a thought? Catch it."
                : "+ Leave a thought here"
          }
          accessory={look === "a" ? "↗" : undefined}
          onPress={() => router.navigate("/capture")}
        />
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
