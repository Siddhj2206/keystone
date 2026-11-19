import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePalette } from "./ui";
import { useLook } from './use-look';
export function TabNavigation(): React.JSX.Element {
  const c = usePalette();
  const {look}=useLook();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "transparent" },
        tabBarStyle: {
          backgroundColor: c.bg,
          borderTopColor: c.line,
          height: 76,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarLabelStyle:{fontSize:10,fontWeight:'500',fontFamily:look==='b'?c.display:undefined},
      }}
    >
      {(
        [
          { name: "index", title: "Today", icon: "sunny-outline" },
          { name: "capture", title: "Capture", icon: "add-circle-outline" },
          { name: "goals", title: "Goals", icon: "planet-outline" },
          { name: "settings", title: "Settings", icon: "options-outline" },
        ] as const
      ).map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }) => (
              <Ionicons name={icon} color={typeof color === 'string' ? color : c.accent} size={20} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
