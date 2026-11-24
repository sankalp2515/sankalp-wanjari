# Sankalp Wanjari — Design System (MASTER)

Audience: Google APM recruiters and hiring managers, then engineers. They give a
portfolio about 30 seconds before deciding to read one case study. Every rule
below serves one goal: **show product judgement fast, then let them go deep.**

## 1. Principles
1. **Decision first.** Lead every project with the call that was made and what it cost, then the build.
2. **One idea per screen.** A section is one claim on the left and its evidence on the right.
3. **Real numbers or none.** Every metric comes from `config/portfolio.ts` and shows its source. Nothing invented.
4. **Motion explains.** Animate only to show sequence, cause or change. Never decoration alone.
5. **Fast is a feature.** The first screen paints in under 1.5 s on a mid-range phone; nothing heavy loads before it is needed.

## 2. Colour (60 / 30 / 10)
Light is the default. Dark is a toggle. Tokens live in `app/globals.css` (`--os-*`).

| Role | Light | Dark | Share |
|---|---|---|---|
| Ground `--os-bg` | `#F4F2EE` | `#0E0D0B` | 60% |
| Surface `--os-bg-window` | `#FFFFFF` | `#161411` | 30% |
| Ink `--os-text` | `#121110` | `#F2EEE6` | 30% |
| Ink 2 `--os-text-secondary` | `#45413B` | `#C9C2B6` | |
| Muted `--os-text-muted` | `#6A655D` | `#9B9488` | |
| Line `--os-border` | `#DEDAD3` | `#2C2823` | |
| Accent `--os-accent` | `#9C5304` | `#F5A623` | 10% |
| Primary button | ink on ground (`--os-cta-bg`) | bone on ground | |

Amber is reserved for: the one highlighted word per screen, live data, active
state and focus. Primary buttons are solid ink (the reference's black pill), so
amber stays rare and meaningful. All text pairs meet WCAG AA (4.5:1).

## 3. Typography
- **Display:** Inter Tight 600–800, tracking −0.045em at display sizes, line-height 0.92.
- **Body:** Inter 400/500, 16–17px, line-height 1.6, measure ≤ 68ch.
- **Label:** JetBrains Mono 500, 12px minimum, tracking 0.14em, uppercase.

Fluid scale (`clamp`): display `clamp(3.2rem, 9vw, 8.5rem)` · h2 `clamp(2rem, 4.4vw, 3.6rem)` ·
h3 `clamp(1.35rem, 2vw, 1.75rem)` · lead 19px · body 16px · small 14px · label 12px.

## 4. Space & grid
- Scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128.
- Container: `min(1440px, 100% − 2·gutter)`, gutter `clamp(20px, 4vw, 56px)`. Text never exceeds ~68ch inside it; visuals may be wider than text.
- 12 columns, 24px gap. **Split section:** label column 4/12 (sticky), content 8/12.
  Sections alternate `split` and `split-reverse` so neighbours never look alike.
- Section rhythm: `padding-block: clamp(72px, 9vw, 128px)`. No per-section backgrounds,
  rails or borders: the page is one continuous surface.
- Below 900px everything stacks; the label column becomes a header.

## 5. Components
`SectionShell` (split / split-reverse / stack) · `Metric` (count-up + source) ·
`DecisionTile` (rotating decision → trade-off) · `DecisionFilm` (pinned project story) ·
`ProjectIndex` (list + hover preview) · `RadarCard` (news + product implication) ·
`Button` (primary ink pill, secondary outline pill, 44px min) · `Chip` (mono label).

## 6. Iconography & illustration
Lucide icons only, 1.5px stroke, 16/20px. No emoji. The illustrated avatar is the
only illustration; project visuals are posters or rendered motion loops.

## 7. Motion
- Durations: micro 150–220ms · content 500–700ms · ambient loops ≥ 6s.
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` in, exits 30% faster.
- Transform and opacity only. Never animate the LCP element's opacity.
- Scroll-linked motion only inside pinned sections (Decision Film).
- Every animation has a `prefers-reduced-motion` fallback that shows the end state.
- Heavy motion graphics are pre-rendered video (HyperFrames), lazy-loaded with a poster.

## 8. Storytelling flow
1. **Hero:** who, what role, one proof line, talk to Sankalp.
2. **Proof strip:** four verified numbers.
3. **How I decide:** rotating decisions and the trade-off each one cost.
4. **Work:** a decision film for the three flagship builds, then an index of the rest.
5. **Product case study:** ArthRakshak, end to end.
6. **AI Radar:** what is changing in AI this week and what it means for products.
7. **About · Career · Credentials · Skills:** the person and the record.
8. **Contact:** one clear action.
