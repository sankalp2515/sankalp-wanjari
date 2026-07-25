# Performance changes — how to revert (no git needed)

This folder holds untouched copies of every file the perf pass modified,
plus the 3 image files that were moved out of `public/`.

## Revert EVERYTHING

Double-click `revert.bat` (Windows), OR run from the project root:

```powershell
Copy-Item _perf_backup\ConciergeContext.tsx.bak contexts\ConciergeContext.tsx -Force
Copy-Item _perf_backup\AgentDock.tsx.bak        components\v2\AgentDock.tsx    -Force
Copy-Item _perf_backup\Hero.tsx.bak             components\v2\Hero.tsx         -Force
Copy-Item _perf_backup\next.config.ts.bak       next.config.ts                -Force
Copy-Item _perf_backup\public\*                 public\                        -Force
```

Then restart the dev server. That restores the exact pre-change state.

## What changed

1. **contexts/ConciergeContext.tsx** — split the fast-changing chat state
   (`messages`, `status`, `statusLine`) into a separate `useConciergeChat()`
   hook so only the chat panel re-renders while the AI streams. Both context
   values are now memoized. Streaming reveals 2 words per tick instead of 1.
2. **components/v2/AgentDock.tsx** — reads chat state from `useConciergeChat()`.
3. **components/v2/Hero.tsx** — hero logo now points at `/logo.png` (optimized
   by next/image at runtime) instead of the 119 KB raw `/logo.svg`.
4. **next.config.ts** — enabled AVIF/WebP output for next/image.
5. **public/** — `profile_pic_1.jpeg`, `profile_pic_3.png`, `profile_pic_4.png`
   were unused (nothing references them) and moved here to cut ~2.8 MB of
   deploy weight. Copies are in `_perf_backup/public/`.

Once you're happy, you can delete this whole `_perf_backup/` folder.
