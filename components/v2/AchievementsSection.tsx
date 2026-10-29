"use client";

import { ArrowUpRight, Trophy } from "lucide-react";
import { achievements } from "@/config/portfolio";
import SectionShell from "./SectionShell";

export default function AchievementsSection() {
  if (!achievements.length) return null;

  return (
    <SectionShell
      id="section-achievements"
      kicker="ACHIEVEMENTS"
      title="Built under pressure. Ranked in competition."
      subtitle="Competition results, separate from the engineering portfolio."
    >
      {achievements.map((achievement) => (
        <article key={achievement.id} className="glass-card rounded-2xl p-5 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
            <div>
              <Trophy size={24} aria-hidden style={{ color: "var(--os-accent)" }} />
              <p className="font-display font-bold text-[34px] leading-tight mt-3" style={{ color: "var(--os-text)" }}>
                {achievement.title}
              </p>
              <p className="text-[13px] mt-2" style={{ color: "var(--os-text-secondary)" }}>{achievement.event}</p>
              <p className="text-[12px] mt-1" style={{ color: "var(--os-text-muted)" }}>{achievement.date}</p>
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-[24px]" style={{ color: "var(--os-text)" }}>{achievement.project}</h3>
              <p className="text-[14px] leading-relaxed mt-2 max-w-prose" style={{ color: "var(--os-text-secondary)" }}>{achievement.description}</p>
              <p className="text-[13px] leading-relaxed mt-3 max-w-prose" style={{ color: "var(--os-text-secondary)" }}>{achievement.approach}</p>
              <ul className="mt-4 space-y-1.5 text-[12px]" style={{ color: "var(--os-text-secondary)" }}>
                {achievement.highlights.map((highlight) => <li key={highlight}>• {highlight}</li>)}
              </ul>
              <a
                href={achievement.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-5 px-3 py-2 rounded-lg border text-[12px] focus-visible:outline-2 focus-visible:outline-offset-4"
                style={{ color: "var(--os-accent)", borderColor: "var(--os-border)" }}
              >
                Read the submission and results <ArrowUpRight size={14} aria-hidden />
              </a>
              <p className="text-[11px] leading-relaxed mt-3 max-w-prose" style={{ color: "var(--os-text-muted)" }}>{achievement.limitation}</p>
            </div>
          </div>
        </article>
      ))}
    </SectionShell>
  );
}
