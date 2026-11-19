import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import { Capture, Goal, Task, id, organize, hasCaptureContent } from "@keystone/core";
import { createStateQueue } from './state-queue';

interface Data {
  tasks: Task[];
  goals: Goal[];
  captures: Capture[];
  morning: string;
  evening: boolean;
}
const empty: Data = {
  tasks: [],
  goals: [],
  captures: [],
  morning: "09:00",
  evening: false,
};
const db = SQLite.openDatabaseAsync("keystone.db");
interface Store {
  data: Data;
  ready: boolean;
  error: string;
  key: string;
  setKey: (key: string) => Promise<void>;
  save: (data: Data) => Promise<void>;
  capture: (text: string, source: "text" | "voice") => Promise<string>;
  updateTask: (task: Task) => Promise<void>;
}
const Context = createContext<Store>(null!);
export function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [data, setData] = useState<Data>(empty);
  const [state] = useState(() => createStateQueue(empty, async next => {
    await (await db).runAsync('INSERT OR REPLACE INTO state (id,json) VALUES (1,?)', JSON.stringify(next));
  }, setData));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [key, setKeyState] = useState("");
  useEffect(() => {
    (async () => {
      const connection = await db;
      await connection.execAsync(
        "CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY, json TEXT NOT NULL)",
      );
      const row = await connection.getFirstAsync<{ json: string }>(
        "SELECT json FROM state WHERE id=1",
      );
      if (row) await state.update(() => JSON.parse(row.json));
      if (Platform.OS !== "web")
        setKeyState((await SecureStore.getItemAsync("gemini-key")) || "");
      setReady(true);
    })().catch((e) => setError(String(e)));
  }, [state]);
  async function save(next: Data): Promise<void> {
    await state.update(() => next);
  }
  async function setKey(value: string): Promise<void> {
    if (Platform.OS === "web" && value)
      throw Error("API keys are only stored in the iOS secure keychain.");
    if (Platform.OS !== "web") {
      if (value) await SecureStore.setItemAsync("gemini-key", value);
      else await SecureStore.deleteItemAsync("gemini-key");
    }
    setKeyState(value);
  }
  async function capture(
    text: string,
    source: "text" | "voice",
  ): Promise<string> {
    if (!hasCaptureContent(text)) throw Error("Add a thought with some letters or numbers first.");
    const item: Capture = {
      id: id(),
      text: text.trim(),
      source,
      createdAt: new Date().toISOString(),
      processed: false,
    };
    await state.update(latest => ({ ...latest, captures: [...latest.captures, item] }));
    const plan = await organize(item, state.get().goals, key);
    await state.update(latest => ({
      ...latest,
      tasks: [...latest.tasks, ...plan.tasks],
      goals: [...latest.goals, ...plan.goals],
      captures: latest.captures.map((c) =>
        c.id === item.id ? { ...c, processed: true } : c,
      ),
    }));
    return `${plan.tasks.length} tasks sorted · ${plan.engine === "local" ? "on your device" : "with Gemini"}`;
  }
  async function updateTask(task: Task): Promise<void> {
    await state.update(latest => ({
      ...latest,
      tasks: latest.tasks.map((t) => (t.id === task.id ? task : t)),
    }));
  }
  return (
    <Context.Provider
      value={{ data, ready, error, key, setKey, save, capture, updateTask }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = (): Store => useContext(Context);
