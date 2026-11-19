import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePalette } from "./ui";
export function TabNavigation(): React.JSX.Element {
  const c = usePalette();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "transparent" },
        tabBarStyle: {
          backgroundColor: c.card,
          borderTopColor: c.line,
          height: 85,
          paddingTop: 10,
          paddingBottom: 24,
        },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
      }}
    >
      {(
        [
          { name: "(today)", title: "Today", icon: "sunny-outline" },
          { name: "(capture)", title: "Capture", icon: "add-circle-outline" },
          { name: "(goals)", title: "Goals", icon: "planet-outline" },
          { name: "(settings)", title: "Settings", icon: "options-outline" },
        ] as const
      ).map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }) => (
              <Ionicons name={icon} color={typeof color === 'string' ? color : c.accent} size={24} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
