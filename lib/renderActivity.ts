"use client";

import { useSyncExternalStore } from "react";

// Only the page underneath an opaque overlay sleeps. The overlay itself keeps
// its own rendering loop, and the covered scenes retain their GPU resources.
const blockers = new Set<symbol>();
const listeners = new Set<() => void>();
function publish() {
  document.documentElement.classList.toggle("page-effects-paused", blockers.size > 0);
  listeners.forEach((listener) => listener());
}
export function suspendPageRendering() {
  const key = Symbol("covered-page");
  blockers.add(key);
  publish();
  return () => { blockers.delete(key); publish(); };
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  document.addEventListener("visibilitychange", listener);
  return () => {
    listeners.delete(listener);
    document.removeEventListener("visibilitychange", listener);
  };
}
const snapshot = () => blockers.size === 0 && !document.hidden;
export function usePageRenderingActive() {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}
