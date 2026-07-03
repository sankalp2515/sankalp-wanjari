"use client";

import { useState, useEffect, useRef } from "react";

export function useTypewriter(lines: string[], speed = 35, startDelay = 0) {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let lineIdx = 0;
    let charIdx = 0;

    const start = setTimeout(() => {
      const tick = setInterval(() => {
        if (lineIdx >= lines.length) {
          clearInterval(tick);
          setDone(true);
          return;
        }

        const line = lines[lineIdx];

        if (charIdx < line.length) {
          setDisplayed((d) => {
            const next = [...d];
            next[lineIdx] = (next[lineIdx] ?? "") + line[charIdx];
            return next;
          });
          charIdx++;
        } else {
          lineIdx++;
          charIdx = 0;
          if (lineIdx < lines.length) {
            setDisplayed((d) => [...d, ""]);
          }
        }
      }, speed);

      return () => clearInterval(tick);
    }, startDelay);

    return () => clearTimeout(start);
  }, []);

  return { displayed, done };
}
