"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";

export type NarrationType = "info" | "action" | "detect" | "idle" | "warn";

export interface NarrationEntry {
  id: number;
  text: string;
  time: Date;
  type: NarrationType;
}

interface NarrationContextValue {
  current: NarrationEntry | null;
  log: NarrationEntry[];
  narrate: (text: string, type?: NarrationType) => void;
  clearLog: () => void;
}

const NarrationContext = createContext<NarrationContextValue>({
  current: null,
  log: [],
  narrate: () => {},
  clearLog: () => {},
});

export function NarrationProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<NarrationEntry | null>(null);
  const [log, setLog] = useState<NarrationEntry[]>([]);
  const idRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const narrate = useCallback((text: string, type: NarrationType = "info") => {
    const entry: NarrationEntry = { id: ++idRef.current, text, time: new Date(), type };
    setCurrent(entry);
    setLog((prev) => [entry, ...prev].slice(0, 200));
    // Notify visual layers (NeuralBackground ripple, etc.)
    window.dispatchEvent(new CustomEvent("skw-narration", { detail: entry }));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCurrent(null), 9000);
  }, []);

  const clearLog = useCallback(() => setLog([]), []);

  return (
    <NarrationContext.Provider value={{ current, log, narrate, clearLog }}>
      {children}
    </NarrationContext.Provider>
  );
}

export function useNarration() {
  return useContext(NarrationContext);
}
