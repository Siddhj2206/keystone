import React from "react";
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
        bg: "#111c19",
        card: "#1c2b26",
        ink: "#edf5ed",
        muted: "#a3b6ad",
        line: "#35473e",
        accent: "#b9d6a2",
        accentInk: "#173829",
      }
    : {
        bg: "#f5f5ed",
        card: "#ffffff",
        ink: "#20392e",
        muted: "#738074",
        line: "#e0e5da",
        accent: "#285b43",
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
  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        paddingTop: 32,
        paddingBottom: 40,
        gap: 20,
        width: "100%",
        maxWidth: 650,
        alignSelf: "center",
      }}
      style={{ flex: 1, backgroundColor: c.bg }}
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
            fontSize: 36,
            lineHeight: 48,
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
  );
}
export function Card({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const c = usePalette();
  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: c.line,
        gap: 12,
      }}
    >
      {children}
    </View>
  );
}
