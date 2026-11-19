import React from "react";
import { Platform, View, ViewProps } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
export function Glass({
  children,
  style,
  ...props
}: ViewProps): React.JSX.Element {
  if (Platform.OS === "ios" && isLiquidGlassAvailable())
    return (
      <GlassView {...props} glassEffectStyle="regular" style={style}>
        {children}
      </GlassView>
    );
  return (
    <View {...props} style={style}>
      {children}
    </View>
  );
}
