"use client";

// Cards are still-image only: no hover listeners, video elements, decoders,
// animated GIF requests or preview preloading. Demos remain in project detail.
import { Bot, CircleDot, GitBranch } from "lucide-react";

const isStill = (src: string) => /\.(avif|webp|png|jpe?g|svg)(?:[?#].*)?$/i.test(src);

function Signal({ id }: { id: string }) {
  if (id === "001") return <div className="project-grid__signal project-grid__signal--agents" aria-hidden><span /><span /><span /><i /><i /><i /></div>;
  if (id === "002") return <div className="project-grid__signal project-grid__signal--research" aria-hidden><span>CLAIM</span><i /><span>SOURCE</span><i /><span>VERIFIED</span></div>;
  return <div className="project-grid__signal project-grid__signal--portfolio" aria-hidden><Bot size={34} /><GitBranch size={18} /><CircleDot size={16} /></div>;
}

export default function ProjectMedia({ id, name, preview, poster }: {
  id: string;
  name: string;
  preview?: string;
  poster?: string;
}) {
  const still = poster && isStill(poster) ? poster : preview && isStill(preview) ? preview : null;
  if (!still) return <Signal id={id} />;
  return <>
    {/* eslint-disable-next-line @next/next/no-img-element -- local optimized still assets, native lazy decode */}
    <img src={still} alt={`${name} product poster`} loading="lazy" decoding="async" className={`project-grid__media-image${/poster-(editorial|distinct)/.test(still) ? " project-grid__media-image--editorial" : ""}`} style={still.includes("poster-distinct") ? { objectFit: "contain", background: id === "007" ? "#080713" : id === "008" ? "#efe8da" : "#182332" } : undefined} />
    {still.includes("poster-distinct") && <span className="absolute bottom-3 left-3 text-[9px] px-2 py-1 rounded-md" style={{ background: "rgba(0,0,0,.8)", color: "#fff" }}>Concept illustration</span>}
  </>;
}
