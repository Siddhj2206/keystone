import React from "react";
import { Alert, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { useStore } from "./store";
import { Button } from "./ui";

function confirm(): Promise<boolean> {
  const text = "This replaces your goals, tasks and captures with the backup.";
  if (Platform.OS === "web") return Promise.resolve(window.confirm(text));
  return new Promise((resolve) =>
    Alert.alert("Restore backup?", text, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "Restore", style: "destructive", onPress: () => resolve(true) },
    ]),
  );
}

export function RestoreButton({ onDone }: { onDone: (message: string) => void }): React.JSX.Element {
  const { restore } = useStore();
  async function pick(): Promise<void> {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true });
      const asset = result.assets?.[0];
      if (result.canceled || !asset) return;
      const json = asset.file ? await asset.file.text() : await new File(asset.uri).text();
      if (!(await confirm())) return;
      await restore(json);
      onDone("Backup restored.");
    } catch (e) {
      onDone(e instanceof Error ? e.message : String(e));
    }
  }
  return <Button quiet title="Restore from a backup" onPress={() => void pick()} />;
}
