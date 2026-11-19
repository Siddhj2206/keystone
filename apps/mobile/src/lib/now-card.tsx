import React from "react";
import { View } from "react-native";
import type { NowAction, Task } from "@keystone/core";
import { useStore } from "./store";
import { Button, Card, Label, usePalette } from "./ui";

const actions: [NowAction, string][] = [
  ["later", "Not now"],
  ["tooBig", "Too big"],
  ["stuck", "Stuck"],
];

/** The one task to do now, with the four answers. */
export function NowCard({ task }: { task: Task }): React.JSX.Element {
  const { act } = useStore();
  const c = usePalette();
  return (
    <Card>
      <Label style={{ fontSize: 12, color: c.muted }}>NOW · {task.minutes} MIN</Label>
      <Label style={{ fontWeight: "700", fontSize: 22 }}>{task.title}</Label>
      <Button title="Done" onPress={() => void act(task, "done")} />
      <View style={{ flexDirection: "row", gap: 8 }}>
        {actions.map(([a, title]) => (
          <View key={a} style={{ flex: 1 }}>
            <Button quiet title={title} onPress={() => void act(task, a)} />
          </View>
        ))}
      </View>
    </Card>
  );
}
