import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Goal, id } from "@keystone/core";
import { useStore } from "../store";
import { Button, Card, Input, Label, Page, usePalette } from "../ui";
import { TaskCard } from "../task-card";
export default function Goals(): React.JSX.Element {
  const { data, save } = useStore();
  const c = usePalette();
  const [selected, setSelected] = useState<string>();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Goal>();
  async function persist(): Promise<void> {
    if (!editing?.title.trim()) return;
    try {
      await save({
        ...data,
        goals: data.goals.map((g) => (g.id === editing.id ? editing : g)),
      });
      setEditing(undefined);
    } catch (e) {
      setMessage(String(e));
    }
  }
  return (
    <Page
      eyebrow="The bigger picture"
      title="Small steps. Meaningful things."
      subtitle="A place for what matters now — and what comes next."
    >
      {(["short", "long"] as const).map((h) => (
        <View key={h} style={{ gap: 14 }}>
          <Label style={{ fontSize: 20, fontWeight: "700" }}>
            {h === "short" ? "On the horizon" : "For the future"}{" "}
            <Label style={{ fontSize: 12, color: c.muted }}>
              {h === "short" ? "SHORT TERM" : "LONG TERM"}
            </Label>
          </Label>
          {data.goals
            .filter((g) => g.horizon === h)
            .map((g) => {
              const tasks = data.tasks.filter((t) => t.goalId === g.id);
              const done = tasks.filter((t) => t.status === "done").length;
              return (
                <View key={g.id} style={{ gap: 12 }}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      setSelected(selected === g.id ? undefined : g.id)
                    }
                  >
                    <Card>
                      <Label
                        style={{
                          fontSize: 11,
                          color: c.muted,
                          letterSpacing: 1,
                        }}
                      >
                        {g.area.toUpperCase()} ↗
                      </Label>
                      <Label style={{ fontSize: 20, fontWeight: "600" }}>
                        {g.title}
                      </Label>
                      <View
                        style={{
                          height: 5,
                          backgroundColor: c.line,
                          borderRadius: 8,
                        }}
                      >
                        <View
                          style={{
                            height: 5,
                            width: `${tasks.length ? (done / tasks.length) * 100 : 0}%`,
                            backgroundColor: c.accent,
                            borderRadius: 8,
                          }}
                        />
                      </View>
                      <Label style={{ color: c.muted, fontSize: 12 }}>
                        {done} of {tasks.length} steps complete
                        {g.targetDate ? ` · Target ${g.targetDate}` : ""}
                      </Label>
                    </Card>
                  </Pressable>
                  {selected === g.id && (
                    <>
                      <Button
                        quiet
                        title="Edit goal"
                        onPress={() => setEditing({ ...g })}
                      />
                      {tasks.length ? (
                        tasks.map((t) => (
                          <TaskCard key={t.id} task={t} editable />
                        ))
                      ) : (
                        <Label>
                          No tasks yet. Mention this area in a capture.
                        </Label>
                      )}
                    </>
                  )}
                </View>
              );
            })}
          {!data.goals.some((g) => g.horizon === h) && (
            <Card>
              <Label style={{ color: c.muted }}>
                Your{" "}
                {h === "short"
                  ? "near-term priorities"
                  : "longer-term ambitions"}{" "}
                will find a home here as you capture thoughts.
              </Label>
            </Card>
          )}
        </View>
      ))}
      {editing && (
        <Card>
          <Input
            value={editing.title}
            onChangeText={(title) => setEditing({ ...editing, title })}
          />
          <Input
            placeholder="Notes"
            value={editing.notes}
            onChangeText={(notes) => setEditing({ ...editing, notes })}
          />
          <Input
            placeholder="Target YYYY-MM-DD (optional)"
            value={editing.targetDate || ""}
            onChangeText={(targetDate) =>
              setEditing({ ...editing, targetDate })
            }
          />
          <Button
            quiet
            title={
              editing.horizon === "short"
                ? "Move to long term"
                : "Move to short term"
            }
            onPress={() =>
              setEditing({
                ...editing,
                horizon: editing.horizon === "short" ? "long" : "short",
              })
            }
          />
          <Button title="Save goal" onPress={() => void persist()} />
        </Card>
      )}
      <Card>
        <Label style={{ fontWeight: "600" }}>
          Something else you’re working toward?
        </Label>
        <Input
          placeholder="Give your goal a name"
          value={title}
          onChangeText={setTitle}
        />
        <Button
          quiet
          title="＋ Add a goal"
          onPress={() => {
            if (!title.trim()) return;
            save({
              ...data,
              goals: [
                ...data.goals,
                {
                  id: id(),
                  title: title.trim(),
                  area: "other",
                  horizon: "long",
                  notes: "",
                },
              ],
            })
              .then(() => setTitle(""))
              .catch((e) => setMessage(String(e)));
          }}
        />
      </Card>
      {!!message && <Label>{message}</Label>}
    </Page>
  );
}
