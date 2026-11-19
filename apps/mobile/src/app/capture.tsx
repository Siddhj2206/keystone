import React, { useRef, useState } from "react";
import { hasCaptureContent } from "@keystone/core";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Glass } from "../lib/glass";
import { Platform, Pressable, View, Animated } from "react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useStore } from "../lib/store";
import {
  Button,
  Card,
  Input,
  Label,
  Page,
  usePalette,
  Display,
  usePulse,
} from "../lib/ui";
import { useLook } from "../lib/use-look";
export default function Capture(): React.JSX.Element {
  const { capture } = useStore();
  const c = usePalette();
  const { look } = useLook();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const pulse = usePulse(look === "a" || listening);
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
  const micButton = (
    <Animated.View
      style={{
        transform: [
          {
            scale: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.05],
            }),
          },
        ],
      }}
    >
      <Glass
        style={{
          borderRadius: look === "a" ? 18 : 64,
          padding: look === "c" ? 4 : 6,
          backgroundColor: c.line,
        }}
      >
        <Pressable
          accessibilityLabel={
            listening ? "Stop recording" : "Start voice capture"
          }
          accessibilityRole="button"
          onPress={() => void mic()}
          disabled={busy}
          style={{
            width: look === "a" ? 44 : 100,
            height: look === "a" ? 44 : 100,
            borderRadius: look === "a" ? 14 : 50,
            backgroundColor: look === "c" ? "transparent" : c.accent,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: c.line,
            boxShadow:
              look === "a"
                ? "0px 0px 24px #b6a1ff44"
                : look === "b"
                  ? "0px 5px 0px #50329a25"
                  : undefined,
          }}
        >
          <Ionicons
            name={listening ? "stop" : "mic-outline"}
            size={look === "a" ? 22 : 36}
            color={look === "c" ? c.accent : c.accentInk}
          />
        </Pressable>
      </Glass>
    </Animated.View>
  );
  return (
    <Page
      eyebrow={
        look === "a"
          ? "CAPTURE / NEW THOUGHT"
          : look === "b"
            ? "A landing pad for your brain"
            : "A place to begin"
      }
      title={
        look === "a"
          ? "Clear your head."
          : look === "b"
            ? "Goodbye,\nbrain tabs."
            : "Leave it here."
      }
      subtitle={
        look === "a"
          ? "Type it. Say it. We’ll find a place for it."
          : look === "b"
            ? "Messy thoughts in. A little magic out."
            : "You don’t need a plan to start. Just a thought."
      }
    >
      {look !== "a" && (
        <View
          style={{
            alignItems: "center",
            paddingVertical: look === "b" ? 8 : 16,
            gap: 12,
          }}
        >
          {micButton}
          <Label style={{ color: c.muted, fontSize: 13 }}>
            {listening
              ? "Listening… tap to finish"
              : look === "b"
                ? "Tap. Talk. Exhale."
                : "Speak freely, or write below."}
          </Label>
        </View>
      )}
      <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
        {look === "a" && (
          <View
            style={{
              padding: 12,
              borderBottomWidth: 1,
              borderColor: c.line,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Ionicons name="search-outline" color={c.muted} size={15} />
            <Label style={{ fontSize: 11, color: c.muted }}>
              What’s taking up space?
            </Label>
            <Label style={{ fontSize: 9, color: c.muted, marginLeft: "auto" }}>
              NEW CAPTURE
            </Label>
          </View>
        )}
        <Input
          accessibilityLabel="Brain dump"
          multiline
          value={text}
          onChangeText={setText}
          editable={!busy}
          placeholder={
            look === "a"
              ? "Finish the OS assignment tomorrow at 4pm, apply for an internship…"
              : look === "b"
                ? "That assignment. That big idea.\nThat thing you keep forgetting…"
                : "Finish my assignment tomorrow.\nMake time for a walk.\nOne thought, or a hundred."
          }
          style={{
            minHeight: look === "a" ? 144 : 120,
            textAlignVertical: "top",
            lineHeight: 25,
            borderWidth: 0,
            backgroundColor: "transparent",
            fontSize: look === "c" ? 16 : 14,
          }}
        />
        {look === "a" && (
          <View
            style={{
              padding: 12,
              paddingTop: 0,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ gap: 4 }}>
              <Label style={{ fontSize: 10, color: c.muted }}>
                TEXT OR VOICE. NO RULES.
              </Label>
              <Label style={{ fontSize: 10, color: c.accent }}>
                {listening ? "Listening…" : "Your next step starts here."}
              </Label>
            </View>
            {micButton}
          </View>
        )}
      </Card>
      <View style={{ gap: 8 }}>
        <Label style={{ fontSize: 9, letterSpacing: 1.2, color: c.muted }}>
          {look === "c" ? "A GENTLE START" : "TRY A LITTLE NUDGE"}
        </Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {["OS assignment tomorrow", "Practice LeetCode", "Go for a walk"].map(
            (thought, i) => (
              <Pressable
                key={thought}
                accessibilityRole="button"
                disabled={busy}
                onPress={() => setText(text ? `${text}\n${thought}` : thought)}
                style={({ pressed }) => ({
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: look === "b" ? 12 : look === "c" ? 3 : 6,
                  borderWidth: 1,
                  borderColor: c.line,
                  backgroundColor: pressed ? c.line : c.card,
                })}
              >
                <Label style={{ fontSize: 10, color: c.muted }}>
                  {look === "b" ? ["📚 ", "⚡ ", "🌿 "][i] : "+ "}
                  {thought}
                </Label>
              </Pressable>
            ),
          )}
        </View>
      </View>
      <Button
        disabled={busy || listening || !hasCaptureContent(text)}
        title={
          busy
            ? "Finding a place for everything…"
            : look === "a"
              ? "Organize capture"
              : look === "b"
                ? "Make a little magic  ✦"
                : "Find a place for this  →"
        }
        accessory={look === "a" ? "↵" : undefined}
        onPress={() => void submit()}
      />
      {!!message && (
        <Card>
          <Label accessibilityLiveRegion="polite">{message}</Label>
        </Card>
      )}
      <Card>
        <Display style={{ fontSize: look === "a" ? 13 : 20, lineHeight: 24 }}>
          You bring the thoughts. We bring the order.
        </Display>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {["Capture", "Sort", "Take one step"].map((step, i) => (
            <View key={step} style={{ gap: 4 }}>
              <Label style={{ fontSize: 9, color: c.accent }}>0{i + 1}</Label>
              <Label style={{ fontSize: 11, color: c.muted }}>{step}</Label>
            </View>
          ))}
        </View>
        <Label style={{ color: c.muted, fontSize: 10, lineHeight: 17 }}>
          Private, offline sorting. Voice prefers on-device recognition; Apple’s
          service may be used when unavailable.
        </Label>
      </Card>
    </Page>
  );
}
