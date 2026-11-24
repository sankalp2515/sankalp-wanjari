// Generates one HyperFrames project per flagship (intentseal/, abide/, caseproof/)
// from a shared four-scene template: Problem → Decision → Trade-off → Outcome.
// Each scene is 2.5 s, so the website maps beats to [0,2.5] [2.5,5] [5,7.5] [7.5,10].
// All copy is condensed from config/portfolio.ts (projects + projectFilms); nothing invented.
//
//   cd motion && node films.mjs   → writes the three project folders (git-ignored)
//   npx hyperframes@0.9.39 render <dir> -o ../public/motion/<dir>.mp4 --crf 30 --keyframe-interval 0.5

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FILMS = {
  intentseal: {
    name: "IntentSeal",
    problem: { head: "Agents read untrusted content, then act on it.", inputs: ["PDF attachment", "Web page", "Email thread", "OCR image"], bad: 1, badLabel: "Hidden instruction", target: "AI agent" },
    decision: { head: "Separate detection from authority.", nodes: ["Detect & normalise", "Intent contract", "Tool-call gate"], verdict: "Blocked: outside intent" },
    tradeoff: { head: "Strong on documents. Weaker on direct chat.", gain: ["99.2%", "recall on 359 third-party-content attacks"], cost: ["68.1%", "direct-turn recall · 5.1% false positives"] },
    outcome: { value: "0/28", label: "reference-agent attacks succeeded with detectors switched off", checks: ["Python SDK", "REST API", "LLM proxy"] },
  },
  abide: {
    name: "Abide",
    problem: { head: "Approving every agent step does not scale.", inputs: ["Employee request", "Agent action", "Agent action", "Injected instruction"], bad: 3, badLabel: "Not authorised", target: "Agent team" },
    decision: { head: "Confirm once. Gate every action.", nodes: ["Grounded work order", "Human confirms once", "Deterministic gate"], verdict: "Agents can't approve themselves" },
    tradeoff: { head: "A small, visible cost for authority.", gain: ["0/126", "authorised calls falsely blocked"], cost: ["+166 ms", "median overhead per workflow"] },
    outcome: { value: "0/28", label: "attacks caused an unauthorised action", checks: ["26/26 normal tasks completed", "256/256 tampering probes caught", "Live on Google Cloud"] },
  },
  caseproof: {
    name: "CaseProof",
    problem: { head: "The first hour after a scam is a paper chase.", inputs: ["Receipts", "Chat logs", "Customer statement", "Bank records"], bad: -1, badLabel: "", target: "Analyst" },
    decision: { head: "Every claim keeps its source.", nodes: ["Evidence + provenance", "Gemini interprets", "Rules own the money"], verdict: "Approval bound to revision" },
    tradeoff: { head: "Slower sign-off, never stale sign-off.", gain: ["0", "reports shipped on outdated approval"], cost: ["Re-review", "whenever new evidence arrives"] },
    outcome: { value: "51", label: "public-cloud browser checks passed", checks: ["Customer journey", "Analyst journey", "Reviewer journey"] },
  },
  assever: {
    name: "Assever",
    problem: { head: "In budget is not the same as approved.", inputs: ["Owner approves 1 basket", "Seller: ship in two", "Retry with new ID", "Supplier B swap"], bad: 1, badLabel: "Second basket", target: "Buyer agent" },
    decision: { head: "Approve once. Every proposal maps to it.", nodes: ["Exact work order", "Owner confirms once", "Reserve money + stock"], verdict: "Admitted: one ₹700 order" },
    tradeoff: { head: "Stricter than a budget guard.", gain: ["126/144", "tasks completed (budget guard: 92)"], cost: ["Held", "unknown outcomes wait, never retried"] },
    outcome: { value: "0/144", label: "unsafe purchases on the deployed system (budget-only guard: 36/144)", checks: ["720-case campaign", "Vertex Gemini", "Live on Google Cloud"] },
  },
  tasleem: {
    name: "Tasleem",
    problem: { head: "Referral says Completed. Was the care done?", inputs: ["Positive stool test", "Referral: Completed", "GI visit confirmed", "Colonoscopy report"], bad: 3, badLabel: "Missing evidence", target: "Clinician" },
    decision: { head: "Status is not evidence.", nodes: ["Case stays open", "Named owner", "Deadline escalation"], verdict: "Dr. Fatima acts next" },
    tradeoff: { head: "Catching gaps costs attention.", gain: ["1.9 days", "median time to alert (vs 16.5)"], cost: ["53.5", "first alerts per 100 patients (vs 38.5)"] },
    outcome: { value: "99.9%", label: "of action-needed journeys reached a named human (status-only: 81.8%)", checks: ["0 incomplete counted as done", "2,000 synthetic journeys", "HL7 v2 + FHIR"] },
  },
};

const W = 1280, H = 720, SCENE = 2.5;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const BASE_CSS = (id) => `
  #${id} { position: absolute; inset: 0; background: #F4F2EE; color: #121110; font-family: Inter, sans-serif; overflow: hidden; }
  #${id} .lbl { position: absolute; left: 72px; top: 60px; font: 500 18px 'JetBrains Mono', monospace; letter-spacing: .14em; text-transform: uppercase; color: #6A655D; }
  #${id} .lbl b { color: #9C5304; font-weight: 500; }
  #${id} .head { position: absolute; left: 72px; bottom: 64px; width: 1136px; font: 900 52px/1.04 Inter, sans-serif; letter-spacing: -0.035em; text-wrap: balance; }
  #${id} .grid { position: absolute; inset: 0; background-image: linear-gradient(#12111008 1px, transparent 1px), linear-gradient(90deg, #12111008 1px, transparent 1px); background-size: 40px 40px; }
`;

const scene = (id, label, idx, css, body, script) => `<template>
  <style>${BASE_CSS(id)}${css}</style>
  <div id="${id}" data-composition-id="${id}" data-width="${W}" data-height="${H}">
    <div class="grid"></div>
    <p class="lbl" id="${id}-lbl"><b>0${idx}</b> · ${label}</p>
    ${body}
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.fromTo("#${id}-lbl", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, 0.05);
    tl.fromTo("#${id}-head", { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 0.15);
    ${script}
    window.__timelines["${id}"] = tl;
  </script>
</template>
`;

function problemScene(f) {
  const id = "problem";
  const p = f.problem;
  const cards = p.inputs.map((t, i) => `<div class="card ${i === p.bad ? "bad" : ""}" id="p-card${i}" style="top:${150 + i * 84}px">${esc(t)}${i === p.bad ? `<span class="flag" id="p-flag">${esc(p.badLabel)}</span>` : ""}</div>`).join("");
  const lines = p.inputs.map((_, i) => `<path id="p-line${i}" class="${i === p.bad ? "hot" : ""}" d="M 400 ${180 + i * 84} C 620 ${180 + i * 84}, 700 300, 880 300" />`).join("");
  return scene(id, "Problem", 1, `
    #problem .card { position: absolute; left: 72px; width: 328px; height: 60px; display: flex; align-items: center; padding: 0 22px; border-radius: 14px; background: #fff; border: 1.5px solid #DEDAD3; font: 700 22px Inter, sans-serif; box-shadow: 0 6px 18px #1e18100f; }
    #problem .card.bad { border-color: #9C5304; }
    #problem .flag { position: absolute; right: -14px; top: -16px; padding: 6px 10px; border-radius: 999px; background: #9C5304; color: #fff; font: 700 14px Inter, sans-serif; }
    #problem svg { position: absolute; inset: 0; }
    #problem path { fill: none; stroke: #CFCAC1; stroke-width: 2.5; stroke-dasharray: 600; stroke-dashoffset: 600; }
    #problem path.hot { stroke: #9C5304; stroke-width: 3.5; }
    #problem .target { position: absolute; left: 880px; top: 230px; width: 300px; height: 140px; border-radius: 70px; background: #121110; color: #F4F2EE; display: grid; place-items: center; font: 900 30px Inter, sans-serif; letter-spacing: -.02em; }
  `, `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${lines}</svg>${cards}<div class="target" id="p-target">${esc(p.target)}</div><h2 class="head" id="problem-head">${esc(p.head)}</h2>`, `
    ${p.inputs.map((_, i) => `tl.fromTo("#p-card${i}", { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, ${(0.15 + i * 0.1).toFixed(2)});`).join("\n    ")}
    tl.fromTo("#p-target", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.6)" }, 0.35);
    ${p.inputs.map((_, i) => `tl.fromTo("#p-line${i}", { strokeDashoffset: 600 }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }, ${(0.6 + i * 0.08).toFixed(2)});`).join("\n    ")}
    ${p.bad >= 0 ? `tl.fromTo("#p-flag", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" }, 1.25);
    tl.fromTo("#p-card${p.bad}", { x: 0 }, { x: 8, duration: 0.08, yoyo: true, repeat: 3, ease: "none" }, 1.3);` : `tl.fromTo(".card", { rotation: 0 }, { rotation: (i) => [-2, 1.5, -1, 2][i], duration: 0.5, ease: "power2.out" }, 1.2);`}
  `);
}

function decisionScene(f) {
  const id = "decision";
  const d = f.decision;
  const xs = [72, 470, 868];
  const nodes = d.nodes.map((t, i) => `<div class="node ${i === 2 ? "gate" : ""}" id="d-node${i}" style="left:${xs[i]}px">${esc(t)}</div>`).join("");
  return scene(id, "Decision", 2, `
    #decision .node { position: absolute; top: 250px; width: 340px; height: 120px; display: grid; place-items: center; text-align: center; padding: 0 24px; border-radius: 20px; background: #fff; border: 1.5px solid #DEDAD3; font: 700 26px/1.15 Inter, sans-serif; box-shadow: 0 10px 28px #1e181014; }
    #decision .node.gate { border: 3px solid #9C5304; }
    #decision .wire { position: absolute; top: 309px; height: 3px; background: #121110; transform-origin: left center; }
    #decision .pulse { position: absolute; top: 302px; left: 432px; z-index: 2; width: 17px; height: 17px; border-radius: 50%; background: #9C5304; box-shadow: 0 0 0 6px #9C530433; }
    #decision .verdict { position: absolute; left: 868px; top: 396px; padding: 10px 16px; border-radius: 999px; background: #121110; color: #F4F2EE; font: 700 19px Inter, sans-serif; }
  `, `<div class="wire" id="d-w0" style="left:412px;width:58px"></div><div class="wire" id="d-w1" style="left:810px;width:58px"></div>${nodes}<div class="pulse" id="d-pulse"></div><div class="verdict" id="d-verdict">${esc(d.verdict)}</div><h2 class="head" id="decision-head">${esc(d.head)}</h2>`, `
    tl.fromTo("#d-node0", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 0.2);
    tl.fromTo("#d-w0", { scaleX: 0 }, { scaleX: 1, duration: 0.2, ease: "power2.out" }, 0.5);
    tl.fromTo("#d-node1", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 0.55);
    tl.fromTo("#d-w1", { scaleX: 0 }, { scaleX: 1, duration: 0.2, ease: "power2.out" }, 0.85);
    tl.fromTo("#d-node2", { y: 24, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.7)" }, 0.9);
    tl.fromTo("#d-pulse", { x: 0, opacity: 0 }, { x: 0, opacity: 1, duration: 0.1 }, 1.25);
    tl.fromTo("#d-pulse", { x: 0 }, { x: 410, duration: 0.55, ease: "power2.inOut" }, 1.3);
    tl.fromTo("#d-verdict", { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "back.out(2)" }, 1.75);
  `);
}

function tradeoffScene(f) {
  const id = "tradeoff";
  const t = f.tradeoff;
  return scene(id, "Trade-off", 3, `
    #tradeoff .beam-wrap { position: absolute; left: 240px; top: 150px; width: 800px; height: 300px; }
    #tradeoff .beam { position: absolute; left: 0; top: 0; width: 800px; height: 8px; border-radius: 4px; background: #121110; transform-origin: 400px 4px; }
    #tradeoff .fulcrum { position: absolute; left: 370px; top: 8px; width: 0; height: 0; border-left: 30px solid transparent; border-right: 30px solid transparent; border-bottom: 46px solid #121110; }
    #tradeoff .pan { position: absolute; top: 26px; width: 320px; padding: 20px 22px; border-radius: 18px; background: #fff; border: 1.5px solid #DEDAD3; box-shadow: 0 10px 28px #1e181014; }
    #tradeoff .pan small { display: block; font: 500 15px 'JetBrains Mono', monospace; letter-spacing: .14em; color: #6A655D; }
    #tradeoff .pan strong { display: block; margin-top: 8px; font: 900 46px/1 Inter, sans-serif; letter-spacing: -0.04em; }
    #tradeoff .pan span { display: block; margin-top: 8px; font: 400 19px/1.3 Inter, sans-serif; color: #45413B; }
    #tradeoff .pan.cost { border: 2.5px solid #9C5304; }
    #tradeoff .pan.cost strong { color: #9C5304; }
  `, `<div class="beam-wrap"><div class="beam" id="t-beam"><div class="pan gain" id="t-gain" style="left:-40px"><small>GAIN</small><strong>${esc(t.gain[0])}</strong><span>${esc(t.gain[1])}</span></div><div class="pan cost" id="t-cost" style="left:520px"><small>COST</small><strong>${esc(t.cost[0])}</strong><span>${esc(t.cost[1])}</span></div></div><div class="fulcrum" id="t-fulcrum"></div></div><h2 class="head" id="tradeoff-head">${esc(t.head)}</h2>`, `
    tl.fromTo("#t-fulcrum", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, 0.15);
    tl.fromTo("#t-beam", { scaleX: 0.2, opacity: 0, rotation: 0 }, { scaleX: 1, opacity: 1, duration: 0.45, ease: "power3.out" }, 0.25);
    tl.fromTo("#t-gain", { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 0.6);
    tl.fromTo("#t-cost", { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 0.8);
    tl.fromTo("#t-beam", { rotation: 0 }, { rotation: 3.5, duration: 0.9, ease: "elastic.out(1, 0.45)" }, 1.25);
    tl.fromTo(["#t-gain", "#t-cost"], { rotation: 0 }, { rotation: -3.5, duration: 0.9, ease: "elastic.out(1, 0.45)" }, 1.25);
  `);
}

function outcomeScene(f) {
  const id = "outcome";
  const o = f.outcome;
  const m = o.value.match(/^(\D*)(\d+)(.*)$/);
  const counts = m && Number(m[2]) > 0;
  const checks = o.checks.map((c, i) => `<li id="o-check${i}"><svg viewBox="0 0 24 24" width="26" height="26"><path id="o-tick${i}" d="M4 12.5 L10 18 L20 6" /></svg>${esc(c)}</li>`).join("");
  return scene(id, "Outcome", 4, `
    #outcome .big { position: absolute; left: 68px; top: 120px; font: 900 220px/1 Inter, sans-serif; letter-spacing: -0.06em; color: #9C5304; }
    #outcome .sub { position: absolute; left: 76px; top: 360px; width: 560px; font: 700 28px/1.25 Inter, sans-serif; color: #121110; }
    #outcome ul { position: absolute; left: 760px; top: 170px; margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 22px; }
    #outcome li { display: flex; align-items: center; gap: 16px; padding: 18px 24px; width: 440px; border-radius: 16px; background: #fff; border: 1.5px solid #DEDAD3; font: 700 24px Inter, sans-serif; }
    #outcome li svg path { fill: none; stroke: #9C5304; stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 30; stroke-dashoffset: 30; }
    #outcome .head { display: none; }
  `, `<div class="big" id="o-big">${esc(o.value)}</div><p class="sub" id="o-sub">${esc(o.label)}</p><ul>${checks}</ul><h2 class="head" id="outcome-head">${esc(f.name)}</h2>`, `
    tl.fromTo("#o-big", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power4.out" }, 0.15);
    ${counts ? `const counter = { n: 0 };
    tl.fromTo(counter, { n: 0 }, { n: ${Number(m[2])}, duration: 0.9, ease: "power3.out", onUpdate: () => { document.getElementById("o-big").textContent = ${JSON.stringify(m[1])} + Math.round(counter.n) + ${JSON.stringify(m[3])}; } }, 0.2);` : ""}
    tl.fromTo("#o-sub", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 0.55);
    ${o.checks.map((_, i) => `tl.fromTo("#o-check${i}", { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, ${(0.8 + i * 0.18).toFixed(2)});
    tl.fromTo("#o-tick${i}", { strokeDashoffset: 30 }, { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" }, ${(1.0 + i * 0.18).toFixed(2)});`).join("\n    ")}
  `);
}

function indexHtml(f) {
  const ids = ["problem", "decision", "tradeoff", "outcome"];
  const hosts = ids.map((id, i) => `      <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${i * SCENE}" data-duration="${SCENE}" data-track-index="1" data-track-kind="graphics" data-width="${W}" data-height="${H}"></div>`).join("\n");
  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>${esc(f.name)} decision film</title><script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script></head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${SCENE * 4}" data-fps="30" data-width="${W}" data-height="${H}">
${hosts}
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`;
}

for (const [dir, f] of Object.entries(FILMS)) {
  mkdirSync(join(dir, "compositions"), { recursive: true });
  writeFileSync(join(dir, "index.html"), indexHtml(f));
  writeFileSync(join(dir, "compositions", "problem.html"), problemScene(f));
  writeFileSync(join(dir, "compositions", "decision.html"), decisionScene(f));
  writeFileSync(join(dir, "compositions", "tradeoff.html"), tradeoffScene(f));
  writeFileSync(join(dir, "compositions", "outcome.html"), outcomeScene(f));
  console.log("wrote", dir);
}
