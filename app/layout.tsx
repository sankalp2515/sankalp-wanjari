import type { Metadata } from "next";
import { JetBrains_Mono, Inter, Inter_Tight, Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { AWARD_TYPE, AWARD_MOTION, FX_TYPE, PALETTE, PALETTE_PREVIEW, awardClasses } from "@/config/awardPass";
import "./globals.css";
import { MOBILE_TUNING } from "@/config/mobileTuning";
import { personal, social, projects } from "@/config/portfolio";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// design-system/MASTER.md §3: Inter Tight display, Inter body, JetBrains label.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});
const interTight = Inter_Tight({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

// AWARD_TYPE (config/awardPass.ts): the replacement stack. It loads under its
// own variable names and html.ap-type points --font-display / --font-inter /
// --font-mono at it, so switching the flag off restores the old fonts.
// FX_TYPE needs the variable file (wght + wdth axes) for the scroll morph.
// next/font only takes literals: when FX_TYPE is off, swap the two preloads.
const apDisplayStatic = Bricolage_Grotesque({ variable: "--font-ap-display", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap", preload: false });
const apDisplayVar = Bricolage_Grotesque({ variable: "--font-ap-display", subsets: ["latin"], axes: ["wdth"], display: "swap", preload: true });
const apDisplay = FX_TYPE ? apDisplayVar : apDisplayStatic;
const apBody = Geist({ variable: "--font-ap-body", subsets: ["latin"], display: "swap" });
const apMono = Geist_Mono({ variable: "--font-ap-mono", subsets: ["latin"], weight: ["400", "500"], display: "swap" });
const fontVars = AWARD_TYPE
  ? `${apDisplay.variable} ${apBody.variable} ${apMono.variable}`
  : `${inter.variable} ${jetbrainsMono.variable} ${interTight.variable}`;

// Runs before first paint so a saved dark preference never flashes light.
// Also stamps the mobile-tuning class BEFORE first layout: adding a class to
// <html> after hydration re-styles and re-lays-out the whole (very long) page.
const THEME_BOOT = `try{var t=localStorage.getItem("portfolio-theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}${MOBILE_TUNING ? 'document.documentElement.classList.add("mobile-tuned");' : ""}${AWARD_MOTION ? 'try{if(!sessionStorage.getItem("ap-intro")){document.documentElement.classList.add("ap-first");sessionStorage.setItem("ap-intro","1")}}catch(e){}' : ""}${PALETTE_PREVIEW ? `try{var q=new URLSearchParams(location.search).get("pal");if(q!==null)localStorage.setItem("pal",q);var p=localStorage.getItem("pal");if(p===null)p=${JSON.stringify(PALETTE)};if(p==="lime"||p==="blue")document.documentElement.setAttribute("data-pal",p)}catch(e){}` : ""}`;

export const metadata: Metadata = {
  metadataBase: new URL(social.website),
  title: `${personal.name} — AI Product Engineer`,
  description: `${personal.tagline} ${personal.roles.join(" and ")} — 3 years shipping software, specialised in agentic AI, RAG, and LLM systems. ${personal.availability}.`,
  keywords: ["AI Engineer", "AI Product Engineer", "AI Product Manager", "ML Engineer", "LangGraph", "Agentic AI", "RAG", "Python", "TypeScript", "Portfolio"],
  authors: [{ name: personal.name }],
  openGraph: {
    title: `${personal.name} — ${personal.roles.join(" · ")}`,
    description: personal.tagline,
    url: social.website,
    siteName: personal.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${personal.name} — ${personal.roles.join(" · ")}`,
    description: personal.tagline,
  },
  robots: { index: true, follow: true },
};

// Structured data — lets search engines and AI sourcing tools parse the person cleanly
function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: personal.name,
    jobTitle: personal.roles.join(", "),
    email: `mailto:${personal.email}`,
    url: social.website,
    sameAs: [social.github, social.linkedin].filter(Boolean),
    address: { "@type": "PostalAddress", addressRegion: personal.location },
    alumniOf: { "@type": "CollegeOrUniversity", name: "IIIT Pune" },
    knowsAbout: ["Agentic AI", "RAG", "LLM Infrastructure", "LangGraph", "Python", "Product Management"],
    hasOccupation: {
      "@type": "Occupation",
      name: "AI Engineer",
      skills: "LangGraph, RAG Systems, LLM Evaluation, Python, FastAPI",
    },
    mainEntityOfPage: projects.map((p) => ({
      "@type": "CreativeWork",
      name: p.name,
      description: p.description,
    })),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" {...(!PALETTE_PREVIEW && PALETTE ? { "data-pal": PALETTE } : {})} suppressHydrationWarning className={`${fontVars} ${awardClasses}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <meta name="theme-color" content="#F4F2EE" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0E0D0B" media="(prefers-color-scheme: dark)" />
      </head>
      <body className="antialiased" style={{ background: "var(--os-bg)" }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
        />
        {/* Skip to main content — accessibility */}
        <a href="#main-content" className="skip-link">Skip to content</a>

        <ThemeProvider>
          <main id="main-content">
            {children}
          </main>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
