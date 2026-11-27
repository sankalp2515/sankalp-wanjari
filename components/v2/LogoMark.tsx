// LogoMark — an organisation's real mark (simple-icons) at a given size, or a
// lettered tile in its brand colour when no mark is available. Server-safe.

import { LOGOS, BRAND_TINT, monogram } from "@/lib/logos";

export default function LogoMark({
  name,
  size = 20,
  tone = "brand",
  className,
}: {
  name: string;
  size?: number;
  /** brand = the owner's colour; ink = currentColor (monochrome rows). */
  tone?: "brand" | "ink";
  className?: string;
}) {
  const logo = LOGOS[name];
  if (logo) {
    // Near-black marks (Next.js, Ollama, Anthropic…) follow the text colour so
    // they stay visible in dark mode.
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(logo.hex.slice(i, i + 2), 16));
    const dark = 0.2126 * r + 0.7152 * g + 0.0722 * b < 48;
    const fill = tone === "ink" || dark ? "currentColor" : logo.hex;
    return (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={name} style={{ flex: "none" }}>
        <path d={logo.path} fill={fill} />
      </svg>
    );
  }
  if (name === "Microsoft") {
    // The four-square mark is geometry, not artwork: drawn exactly.
    const c = tone === "ink" ? ["currentColor", "currentColor", "currentColor", "currentColor"] : ["#F25022", "#7FBA00", "#00A4EF", "#FFB900"];
    return (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={name} style={{ flex: "none" }}>
        <rect x="1" y="1" width="10.5" height="10.5" fill={c[0]} /><rect x="12.5" y="1" width="10.5" height="10.5" fill={c[1]} />
        <rect x="1" y="12.5" width="10.5" height="10.5" fill={c[2]} /><rect x="12.5" y="12.5" width="10.5" height="10.5" fill={c[3]} />
      </svg>
    );
  }
  const tint = tone === "ink" ? "currentColor" : BRAND_TINT[name] ?? "var(--os-text)";
  // Dark letters on light brand colours (FIS green), white on dark ones.
  const light = tint.startsWith("#") && (() => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(tint.slice(i, i + 2), 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55;
  })();
  return (
    <span
      className={`logo-tile ${className ?? ""}`}
      role="img"
      aria-label={name}
      style={{ width: size, height: size, fontSize: Math.round(size * (monogram(name).length > 2 ? 0.3 : monogram(name).length > 1 ? 0.4 : 0.55)), ["--tint" as string]: tint, color: light ? "#111" : "#fff" }}
    >
      {monogram(name)}
    </span>
  );
}
