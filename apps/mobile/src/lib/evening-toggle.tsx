import React from "react";
import { Switch, View } from "react-native";
import { Label } from "./ui";
export function EveningToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}): React.JSX.Element {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Label>Evening review · 20:00</Label>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}
