import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Glass } from "./glass";
import {
  Text,
  View,
  Pressable,
  TextInput,
  useColorScheme,
  ScrollView,
} from "react-native";
export function usePalette() {
  const dark = useColorScheme() === "dark";
  return dark
    ? {
        bg: "#16132e",
        card: "#292241c9",
        ink: "#faf4ff",
        muted: "#bdb1d5",
        line: "#9e8ac533",
        accent: "#d3b2ff",
        accentInk: "#2d174b",
      }
    : {
        bg: "#f4efff",
        card: "#ffffffb8",
        ink: "#30244c",
        muted: "#796c90",
        line: "#bca4d633",
        accent: "#7952c9",
        accentInk: "#ffffff",
      };
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
      style={[{ color: c.ink, fontSize: 15, lineHeight: 23 }, style]}
    >
      {children}
    </Text>
  );
}
export function Button({
  title,
  onPress,
  quiet = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  quiet?: boolean;
  disabled?: boolean;
}): React.JSX.Element {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 18,
        paddingVertical: 13,
        borderRadius: 14,
        backgroundColor: quiet ? c.line : c.accent,
        opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
      })}
    >
      <Label
        style={{
          color: quiet ? c.ink : c.accentInk,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {title}
      </Label>
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
          borderRadius: 16,
          padding: 16,
          fontSize: 16,
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
  const insets = useSafeAreaInsets();
  const dark = useColorScheme() === "dark";
  return (
    <LinearGradient
      colors={
        dark
          ? ["#251642", "#131f39", "#291c38"]
          : ["#e7dcff", "#e1f5ff", "#fff0df"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingTop: Math.max(insets.top, 24) + 16,
          paddingBottom: 110,
          gap: 20,
          width: "100%",
          maxWidth: 650,
          alignSelf: "center",
        }}
        style={{ flex: 1 }}
      >
        <View>
          <Label
            style={{
              fontSize: 11,
              letterSpacing: 2,
              color: c.muted,
              fontWeight: "700",
            }}
          >
            {eyebrow.toUpperCase()}
          </Label>
          <Label
            style={{
              fontSize: 38,
              lineHeight: 44,
              fontWeight: "700",
              letterSpacing: -1.2,
              marginTop: 8,
            }}
          >
            {title}
          </Label>
          <Label style={{ color: c.muted, marginTop: 4 }}>{subtitle}</Label>
        </View>
        {children}
      </ScrollView>
    </LinearGradient>
  );
}
export function Card({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const c = usePalette();
  return (
    <Glass
      style={{
        backgroundColor: c.card,
        borderRadius: 26,
        padding: 20,
        borderWidth: 1,
        borderColor: c.line,
        gap: 12,
      }}
    >
      {children}
    </Glass>
  );
}
