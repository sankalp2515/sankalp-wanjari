"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggle: (e?: React.MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // Restore saved theme. Read synchronously (before the persist effect
  // below can overwrite it); apply after paint so hydration compares
  // against the SSR default.
  useEffect(() => {
    const saved = localStorage.getItem("portfolio-theme") as Theme | null;
    if (saved !== "light" && saved !== "dark") return;
    const raf = requestAnimationFrame(() => setTheme(saved));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("portfolio-theme", theme);
  }, [theme]);

  // Radial-wipe theme toggle using View Transitions API where available
  const toggle = useCallback((e?: React.MouseEvent) => {
    const nextTheme = (t: Theme) => (t === "dark" ? "light" : "dark");
    if (e && typeof document !== "undefined" && "startViewTransition" in document) {
      document.documentElement.style.setProperty("--toggle-x", e.clientX + "px");
      document.documentElement.style.setProperty("--toggle-y", e.clientY + "px");
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t = (document as any).startViewTransition(() => {
          setTheme(nextTheme);
        });
        // Aborted transitions (rapid toggles, hidden tab) reject — expected, not an error
        t?.finished?.catch(() => {});
        t?.ready?.catch(() => {});
      } catch {
        setTheme(nextTheme);
      }
    } else {
      setTheme(nextTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
