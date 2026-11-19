import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoreProvider, useStore } from "../lib/store";
import { Label, usePalette } from "../lib/ui";
import { scheduleReminders } from "../lib/reminders";
function Navigation(): React.JSX.Element {
  const c = usePalette();
  const { data, ready, error } = useStore();
  useEffect(() => {
    if (ready)
      scheduleReminders(data.tasks, data.morning, data.evening).catch(() => {});
  }, [data, ready]);
  if (error) return <Label>Could not open local storage: {error}</Label>;
  if (!ready) return <Label>Opening your space…</Label>;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.bg },
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
      {[
        ["index", "Today", "◉"],
        ["capture", "Capture", "⊕"],
        ["goals", "Goals", "◇"],
        ["settings", "Settings", "☷"],
      ].map(([name, title, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }) => (
              <Label style={{ color, fontSize: 24 }}>{icon}</Label>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
export default function Layout(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Navigation />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
