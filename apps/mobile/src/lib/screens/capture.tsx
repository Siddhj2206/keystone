import React from "react";
import { hasCaptureContent } from '@keystone/core';
import { Ionicons } from "@expo/vector-icons";
import { Glass } from "../glass";
import { Pressable, View } from "react-native";
import { useCapture } from "../use-capture";
import { Button, Card, Input, Label, Page, usePalette } from "../ui";
export default function Capture(): React.JSX.Element {
  const { text, setText, listening, busy, message, canUndo, mic, submit, revert } = useCapture();
  const c = usePalette();
  return (
    <Page
      eyebrow="Make a little space"
      title="Out of your head. Into a plan."
      subtitle="Messy thoughts welcome. We'll take care of the sorting."
    >
      <View style={{ alignItems: "center", paddingVertical: 20, gap: 16 }}>
        <Glass
          style={{ borderRadius: 64, padding: 8, backgroundColor: c.card }}
        >
          <Pressable
            accessibilityLabel={
              listening ? "Stop recording" : "Start voice capture"
            }
            accessibilityRole="button"
            onPress={() => void mic()}
            disabled={busy}
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: c.accent,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 10,
              borderColor: c.line,
            }}
          >
            <Ionicons
              name={listening ? "stop" : "mic"}
              size={38}
              color={c.accentInk}
            />
          </Pressable>
        </Glass>
        <Label style={{ color: c.muted, fontSize: 13 }}>
          {listening
            ? "Listening… tap to finish"
            : "Tap to talk. No need to organize it."}
        </Label>
      </View>
      <Glass style={{ borderRadius: 20 }}>
        <Input
          accessibilityLabel="Brain dump"
          multiline
          value={text}
          onChangeText={setText}
          editable={!busy}
          placeholder={
            "What’s on your mind?\n\n“Finish my OS assignment tomorrow, apply for an internship and practice leetcode on Friday…”"
          }
          style={{ minHeight: 220, textAlignVertical: "top", lineHeight: 27 }}
        />
      </Glass>
      <Button
        disabled={busy || listening || !hasCaptureContent(text)}
        title={
          busy ? "Finding a place for everything…" : "Organize my thoughts  →"
        }
        onPress={() => void submit()}
      />
      {!!message && (
        <Card>
          <Label accessibilityLiveRegion="polite">{message}</Label>
          {canUndo && (
            <Button
              quiet
              title="Undo"
              onPress={() => void revert()}
            />
          )}
        </Card>
      )}
      <Card>
        <Label style={{ fontWeight: "600" }}>A lighter kind of planning</Label>
        <Label style={{ color: c.muted, fontSize: 13 }}>
          Tasks, dates and goals — sorted automatically. Local rules work
          offline. Voice prefers on-device recognition; your iPhone may use
          Apple’s service if unavailable.
        </Label>
      </Card>
    </Page>
  );
}
