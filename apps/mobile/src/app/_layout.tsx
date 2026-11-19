import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoreProvider, useStore } from "../lib/store";
import { Label,usePalette } from "../lib/ui";
import { scheduleReminders } from "../lib/reminders";
import { TabNavigation } from "../lib/tab-navigation";
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { Fraunces_400Regular } from '@expo-google-fonts/fraunces/400Regular';
function Navigation(): React.JSX.Element {
  const { data, ready, error } = useStore();
  const c=usePalette();
  const [fontsLoaded,fontError]=useFonts({Nunito_900Black,Fraunces_400Regular});
  useEffect(() => {
    if (ready)
      scheduleReminders(data.tasks, data.morning, data.evening).catch(() => {});
  }, [data, ready]);
  if (error) return <Label>Could not open local storage: {error}</Label>;
  if (!ready || !fontsLoaded) return <Label>{fontError?'Could not load bundled fonts. Restart to try again.':'Opening your space…'}</Label>;
  return <View style={{flex:1,backgroundColor:c.bg}}><View style={{flex:1,width:'100%',maxWidth:430,alignSelf:'center',overflow:'hidden',borderLeftWidth:1,borderRightWidth:1,borderColor:c.line}}><TabNavigation /></View></View>;
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
