import React, { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Text,
  View,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  AccessibilityInfo,
  StyleSheet,
  Platform,
} from "react-native";
import { Area } from "@keystone/core";
import { Glass } from "./glass";
import { looks } from "./looks";
import { useLook } from "./use-look";
export function usePalette() {
  return looks[useLook().look];
}
export function usePulse(enabled = true) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    const configure = (reduced: boolean) => {
      animation?.stop();
      value.setValue(0);
      if (active && enabled && !reduced) {
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(value, {
              toValue: 1,
              duration: 3200,
              useNativeDriver: true,
            }),
            Animated.timing(value, {
              toValue: 0,
              duration: 3200,
              useNativeDriver: true,
            }),
          ]),
        );
        animation.start();
      }
    };
    AccessibilityInfo.isReduceMotionEnabled()
      .then(configure)
      .catch(() => {});
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      configure,
    );
    return () => {
      active = false;
      animation?.stop();
      listener.remove();
    };
  }, [value, enabled]);
  return value;
}
export function Label({
  children,
  style,
  ...props
}: React.ComponentProps<typeof Text>): React.JSX.Element {
  const c = usePalette();
  return (
    <Text
      {...props}
      style={[
        {
          color: c.ink,
          fontSize: 14,
          lineHeight: 21,
          fontFamily:
            (StyleSheet.flatten(style)?.fontSize || 14) >= 18
              ? c.display
              : undefined,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Display({
  style,
  ...props
}: React.ComponentProps<typeof Text>): React.JSX.Element {
  const c = usePalette();
  return (
    <Label
      {...props}
      style={[
        {
          fontFamily: c.display,
          fontSize: 24,
          lineHeight: 30,
          letterSpacing: -0.6,
        },
        style,
      ]}
    />
  );
}
export function Button({
  title,
  onPress,
  quiet = false,
  disabled = false,
  accessory,
}: {
  title: string;
  onPress: () => void;
  quiet?: boolean;
  disabled?: boolean;
  accessory?: string;
}): React.JSX.Element {
  const c = usePalette();
  const { look } = useLook();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: look === "b" ? 16 : look === "c" ? 4 : 8,
        backgroundColor: quiet ? c.line : c.accent,
        borderWidth: 1,
        borderColor: quiet ? c.line : "transparent",
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: accessory ? "space-between" : "center",
        gap: 8,
      })}
    >
      <Label
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: quiet ? c.ink : c.accentInk,
          textAlign: "center",
          fontFamily: look === "b" ? c.display : undefined,
        }}
      >
        {title}
      </Label>
      {accessory && (
        <Label style={{ fontSize: 13, color: quiet ? c.ink : c.accentInk }}>
          {accessory}
        </Label>
      )}
    </Pressable>
  );
}
export function Input(
  props: React.ComponentProps<typeof TextInput>,
): React.JSX.Element {
  const c = usePalette();
  return (
    <TextInput
      placeholderTextColor={c.muted}
      {...props}
      style={[
        {
          backgroundColor: c.card,
          color: c.ink,
          borderWidth: 1,
          borderColor: c.line,
          borderRadius: c.radius,
          padding: 16,
          fontSize: 14,
          lineHeight: 22,
        },
        props.style,
      ]}
    />
  );
}
export function Page({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const c = usePalette();
  const { look } = useLook();
  const insets = useSafeAreaInsets();
  const pulse = usePulse(look === "a");
  return (
    <LinearGradient colors={c.gradient} style={{ flex: 1 }}>
      {look === "a" && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              filter: Platform.OS === "web" ? "blur(56px)" : undefined,
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.32, 0.55],
              }),
              transform: [
                {
                  translateY: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-16, 20],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["#6555af66", "#5c509500", "#10111600"]}
            style={{
              position: "absolute",
              width: 440,
              height: 400,
              borderRadius: 200,
              top: -200,
              left: -160,
            }}
          />
          <LinearGradient
            colors={["#254d7940", "#20375000"]}
            style={{
              position: "absolute",
              width: 360,
              height: 480,
              borderRadius: 200,
              top: 180,
              right: -250,
            }}
          />
        </Animated.View>
      )}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 24,
          paddingTop: Math.max(insets.top, 24) + 8,
          paddingBottom: 100,
          gap: look === "c" ? 28 : 20,
          width: "100%",
          maxWidth: 430,
          alignSelf: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: look === "c" ? 12 : 8,
          }}
        >
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: look === "b" ? 8 : 6,
                backgroundColor: c.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: c.accentInk,
                  fontSize: 18,
                  fontWeight: "700",
                  lineHeight: 23,
                }}
              >
                k
              </Text>
            </View>
            <Label
              style={{
                fontSize: 13,
                fontWeight: "600",
                letterSpacing: look === "c" ? 1.5 : 0.1,
              }}
            >
              keystone{look === "b" ? " ✦" : ""}
            </Label>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: look === "a" ? "#b7db9a" : c.accent,
              }}
            />
            <Label style={{ fontSize: 10, color: c.muted, letterSpacing: 0.4 }}>
              YOUR SPACE, OFFLINE
            </Label>
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Label
            style={{
              fontSize: 10,
              fontWeight: "600",
              letterSpacing: 1.5,
              color: c.muted,
            }}
          >
            {eyebrow.toUpperCase()}
          </Label>
          <Display
            accessibilityRole="header"
            style={{
              fontSize: look === "b" ? 38 : look === "c" ? 40 : 32,
              lineHeight: look === "a" ? 38 : 44,
              fontWeight: look === "a" ? "600" : "400",
              letterSpacing: look === "b" ? -1.4 : -0.8,
            }}
          >
            {title}
          </Display>
          <Label
            style={{
              fontSize: 13,
              color: c.muted,
              lineHeight: 21,
              maxWidth: 320,
            }}
          >
            {subtitle}
          </Label>
        </View>
        {children}
        <Label
          style={{
            fontSize: 10,
            textAlign: "center",
            color: c.muted,
            letterSpacing: 1,
            marginTop: 8,
          }}
        >
          A LITTLE STRUCTURE. ROOM TO BE YOU.
        </Label>
      </ScrollView>
    </LinearGradient>
  );
}
export function Card({
  children,
  area,
  style,
}: {
  children: React.ReactNode;
  area?: Area;
  style?: React.ComponentProps<typeof View>["style"];
}): React.JSX.Element {
  const c = usePalette();
  const { look } = useLook();
  return (
    <Glass
      style={[
        {
          backgroundColor: look === "b" && area ? c.tint[area] : c.card,
          borderRadius: c.radius,
          padding: look === "c" ? 20 : 16,
          borderWidth: 1,
          borderColor: c.line,
          gap: 12,
          boxShadow:
            look === "b"
              ? "0px 3px 0px #55325412"
              : look === "a"
                ? "inset 0px 1px 0px #ffffff06"
                : undefined,
        },
        style,
      ]}
    >
      {children}
    </Glass>
  );
}
