import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useStore } from "./store";

export function useCapture() {
  const { capture, canUndo, undo } = useStore();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const voice = useRef(false);
  const { voice: startVoice } = useLocalSearchParams<{ voice?: string }>();
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
        setMessage("Voice capture is available in the installed iOS app. Type a thought here.");
        return;
      }
      const p = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!p.granted) {
        setMessage("Microphone permission is off. Enable it in iPhone Settings, or type below.");
        return;
      }
      prefix.current = text ? text + "\n" : "";
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        requiresOnDeviceRecognition: ExpoSpeechRecognitionModule.supportsOnDeviceRecognition(),
      });
    } catch {
      setMessage("Could not start voice capture. Try typing instead.");
    }
  }
  // keystone://capture?voice=1 (Action Button / Shortcuts) starts listening right away.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (startVoice !== "1") {
      autoStarted.current = false;
      return;
    }
    if (autoStarted.current) return;
    autoStarted.current = true;
    setTimeout(() => {
      void mic();
      router.setParams({ voice: undefined });
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startVoice]);
  async function submit(): Promise<void> {
    setBusy(true);
    try {
      const result = await capture(text, voice.current ? "voice" : "text");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setText("");
      voice.current = false;
      setMessage(result);
    } catch (e) {
      setMessage(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function revert(): Promise<void> {
    try {
      await undo();
      setMessage("Undone.");
    } catch (e) {
      setMessage(String(e));
    }
  }
  return { text, setText, listening, busy, message, canUndo, mic, submit, revert };
}
