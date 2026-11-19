import React, { useEffect, useRef } from "react";
import { PlatformColor, useColorScheme } from "react-native";
import { Host, SecureField, type SecureFieldRef, TextField, useNativeState } from "@expo/ui/swift-ui";
import { accessibilityLabel, onSubmit, submitLabel } from "@expo/ui/swift-ui/modifiers";
import { useFocusEffect } from "expo-router";

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
    if (text.get() !== value) text.set(value);
  }, [text, value]);
  return <TextField {...props} text={text} onTextChange={onChange} />;
}

export function NativeSecureField({ value, onCommit }: { value: string; onCommit: (value: string) => void }) {
  const field = useRef<SecureFieldRef>(null);
  const text = useNativeState(value);
  useEffect(() => {
    if (text.get() !== value) text.set(value);
  }, [text, value]);
  useFocusEffect(React.useCallback(() => () => { void field.current?.blur(); }, []));
  function commit() {
    const next = text.get().trim();
    if (next !== value) onCommit(next);
  }
  return <SecureField
    ref={field}
    text={text}
    onFocusChange={(focused) => { if (!focused) commit(); }}
    placeholder="Gemini API key"
    modifiers={[accessibilityLabel("Gemini API key"), submitLabel("done"), onSubmit(commit)]}
  />;
}
