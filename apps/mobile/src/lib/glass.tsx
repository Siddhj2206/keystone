import React from "react";
import { Platform, View, ViewProps } from "react-native";
import { GlassView, isLiquidGlassAvailable, isGlassEffectAPIAvailable } from "expo-glass-effect";
import { useLook } from './use-look';
import { looks } from './looks';
export function Glass({
  children,
  style,
  ...props
}: ViewProps): React.JSX.Element {
  const {look}=useLook();
  if (Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable())
    return (
      <GlassView {...props} glassEffectStyle={look==='a'?'clear':'regular'} tintColor={looks[look].card} style={style}>
        {children}
      </GlassView>
    );
  return (
    <View {...props} style={style}>
      {children}
    </View>
  );
}
