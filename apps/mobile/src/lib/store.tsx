import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Area, Capture, Goal, Rules, Task, NowAction, answer, classify, planDay, id, nowAction, hasCaptureContent, matchTask, ruleWord } from "@keystone/core";
import { createStateQueue } from './state-queue';
import { loadRows, saveRows } from "./db";
import { parseBackup } from "./backup";
import { acceptChecks, recoverMissed, autoBackup, retryCaptures, sortCapture } from "./catch-up";
import { undoCapture, commandUndo } from './undo';

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
  saveReminderPreferences: (changes: Partial<Pick<Data, "morning" | "evening">>) => Promise<Data>;
  capture: (text: string, source: "text" | "voice") => Promise<string>;
  updateTask: (task: Task) => Promise<void>;
  restore: (json: string) => Promise<void>;
  /** Resolves a Check stack item: keep the guess, or re-file it and remember the correction. */
  resolveCheck: (task: Task, area?: Area) => Promise<void>;
  /** Applies a Now-card answer (Done, Not now, Too big, Stuck). */
  act: (task: Task, action: NowAction) => Promise<void>;
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
  // Reverses only the last command or capture, leaving later edits alone.
  const [undoTo, setUndoTo] = useState<{ run: (l: Data) => Data }>();
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
      void acceptChecks(state).then(() => recoverMissed(state));
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
  async function act(task: Task, action: NowAction): Promise<void> {
    await state.update((l) => ({ ...l, tasks: nowAction(l.tasks, task, action) }));
    // Undo is offered for captures only; a Now answer makes the older Undo stale.
    setUndoTo(undefined);
  }
  function remember(run: (l: Data) => Data): void {
    setUndoTo({ run });
  }
  async function undo(): Promise<void> {
    if (!undoTo) return;
    await state.update(undoTo.run);
    setUndoTo(undefined);
  }
  async function command(text: string): Promise<string | undefined> {
    const intent = classify(text);
    const latest = state.get();
    if (intent.kind === "question")
      return answer(intent.topic, latest.tasks, latest.goals, planDay(latest.tasks, latest.goals));
    if (intent.kind === "capture") return undefined;
    const task = matchTask(intent.query, latest.tasks);
    if (!task) return undefined;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    let reverse:((l:Data)=>Data)|undefined;
    await state.update((l) => {
      const before=l.tasks.find(t=>t.id===task.id);
      if(!before) return l;
      const after:Task|undefined=intent.kind==='drop'?undefined:intent.kind==='done'?{...before,status:'done',completedAt:new Date().toISOString()}:{...before,status:'snoozed',dueDate:tomorrow.toISOString()};
      reverse=commandUndo(before,after,l.tasks.indexOf(before));
      return {...l,tasks:after?l.tasks.map(t=>t.id===before.id?after:t):l.tasks.filter(t=>t.id!==before.id)};
    });
    if(reverse) remember(reverse);
    return `${intent.kind === "done" ? "Marked done" : intent.kind === "drop" ? "Dropped" : "Moved to tomorrow"}: ${task.title}`;
  }
  async function restore(json: string): Promise<void> {
    const backup = parseBackup(json);
    await state.update((latest) => ({ ...latest, ...backup }));
  }
  async function save(next: Data): Promise<void> {
    await state.update(() => next);
  }
  async function saveReminderPreferences(changes: Partial<Pick<Data, "morning" | "evening">>): Promise<Data> {
    await state.update((latest) => ({ ...latest, ...changes }));
    return state.get();
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
    const item: Capture = {
      id: id(),
      text: text.trim(),
      source,
      createdAt: new Date().toISOString(),
      processed: false,
    };
    await state.update(latest => ({ ...latest, captures: [...latest.captures, item] }));
    const createdGoals = new Set<string>();
    remember((l) => undoCapture(l,item.id,createdGoals));
    let plan;
    try {
      plan = await sortCapture(state, item, key);
      plan.goals.forEach(g=>createdGoals.add(g.id));
    } catch {
      return "Saved. Keystone will sort it next time you open the app.";
    }
    return `${plan.tasks.length} tasks sorted · ${plan.engine === "local" ? "on your device" : "with Gemini"}`;
  }
  async function updateTask(task: Task): Promise<void> {
    await state.update(latest => ({
      ...latest,
      // Newly linking a goal settles the area, so the task leaves Check.
      tasks: latest.tasks.map((t) => (t.id !== task.id ? t : task.goalId && task.goalId !== t.goalId ? { ...task, checkBy: undefined } : task)),
    }));
  }
  return (
    <Context.Provider
      value={{ data, ready, error, key, setKey, save, saveReminderPreferences, capture, updateTask, restore, resolveCheck, act, canUndo: !!undoTo, undo }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = (): Store => useContext(Context);
