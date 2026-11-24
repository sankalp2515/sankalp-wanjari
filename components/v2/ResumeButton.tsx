"use client";

// A button that opens the in-page résumé viewer (ResumeModal listens for
// "resume:open"). Lets server components offer the action without becoming
// client components themselves.

import type { ReactNode } from "react";

export default function ResumeButton({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new CustomEvent("resume:open"))}>
      {children}
    </button>
  );
}
