import React, { useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Glass } from "../lib/glass";
import { Platform, Pressable, View } from "react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useStore } from "../lib/store";
import { Button, Card, Input, Label, Page, usePalette } from "../lib/ui";
export default function Capture(): React.JSX.Element {
  const { capture } = useStore();
  const c = usePalette();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const voice = useRef(false);
  const prefix = useRef("");
  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("result", (e) => {
    voice.current = true;
    setText(prefix.current + (e.results[0]?.transcript || ""));
  });
  useSpeechRecognitionEvent("error", (e) => {
    setMessage(`Voice unavailable: ${e.message}. You can always type below.`);
    setListening(false);
  });
  async function mic(): Promise<void> {
    try {
      if (listening) {
        ExpoSpeechRecognitionModule.stop();
        return;
      }
      if (Platform.OS === "web") {
        setMessage(
          "Voice capture is available in the installed iOS app. Type a thought here.",
        );
        return;
      }
      const p = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!p.granted) {
        setMessage(
          "Microphone permission is off. Enable it in iPhone Settings, or type below.",
        );
        return;
      }
      prefix.current = text ? text + "\n" : "";
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        requiresOnDeviceRecognition:
          ExpoSpeechRecognitionModule.supportsOnDeviceRecognition(),
      });
    } catch {
      setMessage("Could not start voice capture. Try typing instead.");
    }
  }
  async function submit(): Promise<void> {
    setBusy(true);
    try {
      const result = await capture(text, voice.current ? "voice" : "text");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      setText("");
      voice.current = false;
      setMessage(result);
    } catch (e) {
      setMessage(String(e));
    } finally {
      setBusy(false);
    }
  }
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
        disabled={busy || listening || !text.trim()}
        title={
          busy ? "Finding a place for everything…" : "Organize my thoughts  →"
        }
        onPress={() => void submit()}
      />
      {!!message && (
        <Card>
          <Label accessibilityLiveRegion="polite">{message}</Label>
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
