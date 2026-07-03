import type { Metadata } from "next";
import { JetBrains_Mono, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { personal, social, projects } from "@/config/portfolio";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(social.website),
  title: `${personal.name} — ${personal.roles.join(" · ")}`,
  description: `${personal.tagline} ${personal.roles.join(" and ")} — 3 years shipping software, specialised in agentic AI, RAG, and LLM systems. ${personal.availability}.`,
  keywords: ["AI Engineer", "AI Product Manager", "ML Engineer", "LangGraph", "Agentic AI", "RAG", "Python", "TypeScript", "Portfolio"],
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
    <html lang="en" data-theme="dark" className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable}`}>
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
      </body>
    </html>
  );
}
