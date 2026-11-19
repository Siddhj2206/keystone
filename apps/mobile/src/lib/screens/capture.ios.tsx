import React, { useRef } from "react";
import { Button, Image, List, ProgressView, Section, Text, VStack, type TextFieldRef } from "@expo/ui/swift-ui";
import { accessibilityLabel, buttonBorderShape, buttonStyle, disabled, font, foregroundStyle, frame, listRowBackground, listRowSeparator, listStyle, padding, textInputAutocapitalization } from "@expo/ui/swift-ui/modifiers";
import { hasCaptureContent } from "@keystone/core";
import { NativeField, NativeHost, secondary } from "../native-ui";
import { useCapture } from "../use-capture";

export default function Capture(): React.JSX.Element {
  const { text, setText, listening, busy, message, canUndo, mic, submit, revert } = useCapture();
  const field = useRef<TextFieldRef>(null);
  const unavailable = busy || listening || !hasCaptureContent(text);
  function organize() {
    if (unavailable) return;
    void field.current?.blur();
    void submit();
  }
  return (
    <NativeHost>
      <List modifiers={[listStyle("insetGrouped")]}>
        <Section>
          <VStack spacing={12} modifiers={[frame({ maxWidth: Infinity }), padding({ top: 10, bottom: 13 }), listRowBackground("transparent"), listRowSeparator("hidden")]}>
            <Button onPress={() => {
              void field.current?.blur();
              void mic();
            }} modifiers={[
              buttonStyle("glassProminent"),
              buttonBorderShape("circle"),
              disabled(busy),
              accessibilityLabel(listening ? "Stop recording" : "Start voice capture"),
            ]}>
              <Image systemName={listening ? "stop.fill" : "mic.fill"} size={33} modifiers={[frame({ width: 78, height: 78 })]} />
            </Button>
            <Text modifiers={[font({ textStyle: "headline" })]}>{listening ? "Listening…" : "Tap to speak"}</Text>
            <Text modifiers={[font({ textStyle: "subheadline" }), foregroundStyle(secondary)]}>
              {listening ? "Tap again to stop recording." : "Or type a thought below."}
            </Text>
          </VStack>
        </Section>
        <Section title="Your thought" footer={<Text>Keystone sorts tasks, dates, and goals for you.</Text>}>
          <NativeField
            ref={field}
            value={text}
            onChange={setText}
            axis="vertical"
            placeholder="What’s on your mind?"
            modifiers={[
              accessibilityLabel("Your thought"),
              textInputAutocapitalization("sentences"),
              disabled(busy),
              frame({ minHeight: 78, maxWidth: Infinity, alignment: "topLeading" }),
              padding({ vertical: 6 }),
            ]}
          />
          {busy
            ? <ProgressView><Text>Organizing…</Text></ProgressView>
            : <Button label="Organize" systemImage="arrow.up.circle" onPress={organize} modifiers={[disabled(unavailable)]} />}
        </Section>
        {!!message && <Section title="Result">
          <Text>{message}</Text>
          {canUndo && <Button label="Undo" systemImage="arrow.uturn.backward" onPress={() => void revert()} />}
        </Section>}
      </List>
    </NativeHost>
  );
}
