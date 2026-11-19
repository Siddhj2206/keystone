import React, { useEffect } from "react";
import { PlatformColor, useColorScheme } from "react-native";
import { Host, SecureField, TextField, useNativeState } from "@expo/ui/swift-ui";
import { accessibilityLabel } from "@expo/ui/swift-ui/modifiers";

export const accent = PlatformColor("systemIndigo");
export const secondary = { type: "hierarchical", style: "secondary" } as const;

export function NativeHost({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  return <Host style={{ flex: 1 }} colorScheme={scheme ?? undefined} seedColor={accent}>{children}</Host>;
}

type FieldProps = Omit<React.ComponentProps<typeof TextField>, "text" | "onTextChange"> & {
  value: string;
  onChange: (value: string) => void;
};

export function NativeField({ value, onChange, ...props }: FieldProps) {
  const text = useNativeState(value);
  useEffect(() => {
    if (text.value !== value) text.value = value;
  }, [text, value]);
  return <TextField {...props} text={text} onTextChange={onChange} />;
}

export function NativeSecureField({ value, onChange }: Pick<FieldProps, "value" | "onChange">) {
  const text = useNativeState(value);
  useEffect(() => {
    if (text.value !== value) text.value = value;
  }, [text, value]);
  return <SecureField
    text={text}
    onTextChange={onChange}
    placeholder="Gemini API key"
    modifiers={[accessibilityLabel("Gemini API key")]}
  />;
}
