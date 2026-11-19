import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Area, Capture, Goal, Rules, Task, answer, classify, focusTasks, id, hasCaptureContent, matchTask, ruleWord } from "@keystone/core";
import { createStateQueue } from './state-queue';
import { loadRows, saveRows } from "./db";
import { parseBackup } from "./backup";
import { acceptChecks, autoBackup, retryCaptures, sortCapture } from "./catch-up";

export interface Data {
  tasks: Task[];
  goals: Goal[];
  captures: Capture[];
  morning: string;
  evening: boolean;
  lastBackupAt?: string;
  rules?: Rules;
}
const empty: Data = {
  tasks: [],
  goals: [],
  captures: [],
  morning: "09:00",
  evening: false,
};
interface Store {
  data: Data;
  ready: boolean;
  error: string;
  key: string;
  setKey: (key: string) => Promise<void>;
  save: (data: Data) => Promise<void>;
  capture: (text: string, source: "text" | "voice") => Promise<string>;
  updateTask: (task: Task) => Promise<void>;
  restore: (json: string) => Promise<void>;
  /** Resolves a Check stack item: keep the guess, or re-file it and remember the correction. */
  resolveCheck: (task: Task, area?: Area) => Promise<void>;
  canUndo: boolean;
  undo: () => Promise<void>;
}
const toRows = ({ tasks, goals, captures, ...prefs }: Data) => ({ tasks, goals, captures, prefs });
const Context = createContext<Store>(null!);
export function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [data, setData] = useState<Data>(empty);
  const [state] = useState(() => createStateQueue(empty, next => saveRows(toRows(next)), setData));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [key, setKeyState] = useState("");
  const [undoTo, setUndoTo] = useState<Pick<Data, "tasks" | "goals" | "captures">>();
  useEffect(() => {
    (async () => {
      const rows = await loadRows();
      if (rows) await state.update(() => ({ ...empty, ...rows.prefs, tasks: rows.tasks, goals: rows.goals, captures: rows.captures }));
      if (Platform.OS !== "web")
        setKeyState((await SecureStore.getItemAsync("gemini-key")) || "");
      setReady(true);
    })().catch((e) => setError(String(e)));
  }, [state]);
  useEffect(() => {
    if (!ready) return;
    const catchUp = (): void => {
      void retryCaptures(state, key);
      void autoBackup(state);
      void acceptChecks(state);
    };
    catchUp();
    const sub = AppState.addEventListener("change", (s) => s === "active" && catchUp());
    return () => sub.remove();
  }, [ready, key, state]);
  async function resolveCheck(task: Task, area?: Area): Promise<void> {
    const word = area && area !== task.area ? ruleWord(task.title) : undefined;
    await state.update((l) => ({
      ...l,
      rules: word ? { ...l.rules, [word]: area! } : l.rules,
      tasks: l.tasks.map((t) => (t.id === task.id ? { ...t, area: area ?? t.area, checkBy: undefined } : t)),
    }));
  }
  function remember(): void {
    const { tasks, goals, captures } = state.get();
    setUndoTo({ tasks, goals, captures });
  }
  async function undo(): Promise<void> {
    if (!undoTo) return;
    await state.update((l) => ({ ...l, ...undoTo }));
    setUndoTo(undefined);
  }
  async function command(text: string): Promise<string | undefined> {
    const intent = classify(text);
    const latest = state.get();
    if (intent.kind === "question")
      return answer(intent.topic, latest.tasks, latest.goals, focusTasks(latest.tasks));
    if (intent.kind === "capture") return undefined;
    const task = matchTask(intent.query, latest.tasks);
    if (!task) return undefined;
    remember();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    await state.update((l) => ({
      ...l,
      tasks:
        intent.kind === "drop"
          ? l.tasks.filter((t) => t.id !== task.id)
          : l.tasks.map((t) =>
              t.id !== task.id
                ? t
                : intent.kind === "done"
                  ? { ...t, status: "done", completedAt: new Date().toISOString() }
                  : { ...t, status: "snoozed", dueDate: tomorrow.toISOString() },
            ),
    }));
    return `${intent.kind === "done" ? "Marked done" : intent.kind === "drop" ? "Dropped" : "Moved to tomorrow"}: ${task.title}`;
  }
  async function restore(json: string): Promise<void> {
    const backup = parseBackup(json);
    await state.update((latest) => ({ ...latest, ...backup }));
  }
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
    const handled = await command(text);
    if (handled) return handled;
    remember();
    const item: Capture = {
      id: id(),
      text: text.trim(),
      source,
      createdAt: new Date().toISOString(),
      processed: false,
    };
    await state.update(latest => ({ ...latest, captures: [...latest.captures, item] }));
    let plan;
    try {
      plan = await sortCapture(state, item, key);
    } catch {
      return "Saved. Keystone will sort it next time you open the app.";
    }
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
      value={{ data, ready, error, key, setKey, save, capture, updateTask, restore, resolveCheck, canUndo: !!undoTo, undo }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = (): Store => useContext(Context);
