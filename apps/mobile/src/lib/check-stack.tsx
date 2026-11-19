import React from "react";
import { View } from "react-native";
import type { Area, Task } from "@keystone/core";
import { useStore } from "./store";
import { Button, Card, Label, usePalette } from "./ui";

const areas: Area[] = ["academics", "career", "skills", "health", "life"];

/** Guesses Keystone wasn't sure about. Each is kept automatically after 48 hours. */
export function CheckStack(): React.JSX.Element | null {
  const { data, resolveCheck } = useStore();
  const c = usePalette();
  const pending = data.tasks.filter((t: Task) => t.checkBy && t.status !== "done");
  if (!pending.length) return null;
  const task = pending[0];
  return (
    <Card>
      <Label style={{ fontWeight: "700" }}>Check · {pending.length}</Label>
      <Label>{task.title}</Label>
      <Label style={{ fontSize: 12, color: c.muted }}>
        Where does this go? Keystone keeps its guess if you skip it.
      </Label>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {areas.map((a) => (
          <Button key={a} quiet title={a} onPress={() => void resolveCheck(task, a)} />
        ))}
        <Button title="Looks right" onPress={() => void resolveCheck(task)} />
      </View>
    </Card>
  );
}
