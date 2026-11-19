import React from "react";
import { Stack } from "expo-router";
import { Platform, PlatformColor } from "react-native";

export function TabStack({ screen, title }: { screen: string; title: string }): React.JSX.Element {
  const native = Platform.OS === "ios";
  return (
    <Stack screenOptions={{
      headerShown: native,
      headerLargeTitleEnabled: native,
      headerLargeTitleShadowVisible: false,
      headerShadowVisible: false,
      ...(native && {
        contentStyle: { backgroundColor: PlatformColor("systemGroupedBackground") },
      }),
    }}>
      <Stack.Screen name={screen} options={{ title }} />
    </Stack>
  );
}
