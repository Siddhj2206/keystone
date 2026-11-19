import React, { useEffect } from "react";
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
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Navigation />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
