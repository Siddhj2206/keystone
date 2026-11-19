import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import { Capture, Goal, Task, id, organize } from "@keystone/core";

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
      if (row) setData(JSON.parse(row.json));
      if (Platform.OS !== "web")
        setKeyState((await SecureStore.getItemAsync("gemini-key")) || "");
      setReady(true);
    })().catch((e) => setError(String(e)));
  }, []);
  async function save(next: Data): Promise<void> {
    await (
      await db
    ).runAsync(
      "INSERT OR REPLACE INTO state (id,json) VALUES (1,?)",
      JSON.stringify(next),
    );
    setData(next);
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
    if (!text.trim()) throw Error("Add a thought first.");
    const item: Capture = {
      id: id(),
      text: text.trim(),
      source,
      createdAt: new Date().toISOString(),
      processed: false,
    };
    const pending = { ...data, captures: [...data.captures, item] };
    await save(pending);
    const plan = await organize(item, data.goals, key);
    await save({
      ...pending,
      tasks: [...data.tasks, ...plan.tasks],
      goals: [...data.goals, ...plan.goals],
      captures: pending.captures.map((c) =>
        c.id === item.id ? { ...c, processed: true } : c,
      ),
    });
    return `${plan.tasks.length} tasks sorted · ${plan.engine === "local" ? "on your device" : "with Gemini"}`;
  }
  async function updateTask(task: Task): Promise<void> {
    await save({
      ...data,
      tasks: data.tasks.map((t) => (t.id === task.id ? task : t)),
    });
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
