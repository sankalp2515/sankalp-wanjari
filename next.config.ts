import type { NextConfig } from "next";

// ── Content-Security-Policy ────────────────────────────────────
// Next's App Router injects inline <script>/<style> for hydration and Tailwind,
// and Three.js/GSAP animate inline styles — so 'unsafe-inline' is required for
// script/style to avoid breaking the site. connect-src is 'self' only: the
// browser never talks to LLM/Resend/ElevenLabs directly (all proxied through
// our own API routes), so no third-party hosts are whitelisted. frame-ancestors
// 'none' blocks clickjacking; object-src 'none' blocks plugin abuse.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  // 'self' (not 'none') so the resume PDF can be embedded in our own
  // <iframe> viewer; cross-origin framing/clickjacking is still blocked.
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
];

const nextConfig: NextConfig = {
  images: {
    // Serve AVIF (then WebP) — much smaller than the source PNG/JPEG for the
    // portrait and logo. next/image negotiates the best format per browser.
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
