import React, { useRef } from "react";
import { Button, HStack, Image, Label, List, ProgressView, Section, Text, VStack, type TextFieldRef } from "@expo/ui/swift-ui";
import { accessibilityHidden, accessibilityLabel, buttonStyle, contentShape, disabled, font, foregroundStyle, frame, glassEffect, lineLimit, listRowBackground, listRowSeparator, listStyle, padding, shapes, symbolEffect, textInputAutocapitalization } from "@expo/ui/swift-ui/modifiers";
import { hasCaptureContent } from "@keystone/core";
import { accent, NativeField, NativeHost, secondary } from "../native-ui";
import { useStore } from "../store";
import { useCapture } from "../use-capture";

export default function Capture(): React.JSX.Element {
  const { text, setText, listening, busy, message, canUndo, mic, submit, revert } = useCapture();
  const { data } = useStore();
  const field = useRef<TextFieldRef>(null);
  const unavailable = busy || listening || !hasCaptureContent(text);
  const recent = [...data.captures].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 3);
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
              buttonStyle("plain"),
              glassEffect({ glass: { variant: "regular", interactive: true }, shape: "circle" }),
              disabled(busy),
              accessibilityLabel(listening ? "Stop recording" : "Start voice capture"),
            ]}>
              <Image systemName={listening ? "waveform" : "mic.fill"} size={30} color={accent} modifiers={[
                ...(listening ? [symbolEffect({ effect: "variableColor", fillStyle: "iterative" }, { options: { repeat: "continuous" } })] : []),
                frame({ width: 78, height: 78 }),
                contentShape(shapes.circle()),
              ]} />
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
            : <Button onPress={organize} modifiers={[disabled(unavailable)]}>
                <Label title="Organize" systemImage="arrow.up.circle" modifiers={[foregroundStyle(unavailable ? secondary : accent)]} />
              </Button>}
        </Section>
        {!!message && <Section title="Result">
          <Text>{message}</Text>
          {canUndo && <Button label="Undo" systemImage="arrow.uturn.backward" onPress={() => void revert()} />}
        </Section>}
        <Section title="Recent">
          {recent.length ? recent.map((capture) => {
            const tasks = data.tasks.filter((task) => task.captureId === capture.id);
            const outcomes = tasks.slice(0, 2).map((task) => task.title);
            if (tasks.length > 2) outcomes.push(`+${tasks.length - 2} more`);
            return (
              <HStack key={capture.id} spacing={12} modifiers={[padding({ vertical: 4 })]}>
                <Image systemName={capture.source === "voice" ? "waveform" : "text.bubble"} size={18} color={accent} modifiers={[frame({ width: 25 }), accessibilityHidden(true)]} />
                <VStack alignment="leading" spacing={3}>
                  <Text modifiers={[lineLimit(1)]}>{capture.text}</Text>
                  <Text modifiers={[font({ textStyle: "caption" }), foregroundStyle(secondary), lineLimit(2)]}>
                    {!capture.processed ? "Waiting to be sorted" : tasks.length ? `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} · ${outcomes.join(" · ")}` : "No linked tasks"}
                  </Text>
                </VStack>
              </HStack>
            );
          }) : <Text modifiers={[foregroundStyle(secondary)]}>Your organized captures will appear here.</Text>}
        </Section>
      </List>
    </NativeHost>
  );
}
