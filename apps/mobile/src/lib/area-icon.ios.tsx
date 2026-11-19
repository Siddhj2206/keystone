import React from "react";
import { View } from "react-native";
import { SymbolView } from "expo-symbols";
import { Area } from "@keystone/core";
import { Label, usePalette } from "./ui";
import { useLook } from "./use-look";
const symbols = {
  academics: "book.closed.fill",
  career: "briefcase.fill",
  skills: "chevron.left.forwardslash.chevron.right",
  health: "figure.run",
  life: "house.fill",
  other: "sparkles",
} as const;
const emoji = {
  academics: "📚",
  career: "🚀",
  skills: "⚡",
  health: "🍊",
  life: "🌷",
  other: "✨",
};
export function AreaIcon({ area }: { area: Area }): React.JSX.Element {
  const c = usePalette();
  const { look } = useLook();
  return (
    <View
      accessibilityLabel={area}
      style={{
        width: look === "c" ? 10 : 32,
        height: look === "c" ? 10 : 32,
        borderRadius: look === "c" ? 5 : look === "b" ? 10 : 8,
        backgroundColor: look === "c" ? c.area[area] : c.tint[area],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {look === "b" ? (
        <Label style={{ fontSize: 18 }}>{emoji[area]}</Label>
      ) : look === "a" ? (
        <SymbolView name={symbols[area]} tintColor={c.area[area]} size={17} />
      ) : null}
    </View>
  );
}
