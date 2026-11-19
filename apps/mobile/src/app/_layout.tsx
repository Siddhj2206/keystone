import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoreProvider, useStore } from "../lib/store";
import { Label } from "../lib/ui";
import { scheduleReminders } from "../lib/reminders";
import { TabNavigation } from "../lib/tab-navigation";
function Navigation(): React.JSX.Element {
  const { data, ready, error } = useStore();
  useEffect(() => {
    if (ready)
      scheduleReminders(data.tasks, data.morning, data.evening).catch(() => {});
  }, [data, ready]);
  if (error) return <Label>Could not open local storage: {error}</Label>;
  if (!ready) return <Label>Opening your space…</Label>;
  return <TabNavigation />;
}
export default function Layout(): React.JSX.Element {
  const scheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
        <StoreProvider>
          <Navigation />
        </StoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
