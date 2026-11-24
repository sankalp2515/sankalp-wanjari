// Generates key-art posters (1672x941) matching the existing IntentSeal/Abide
// style, then screenshots them with headless Edge. Copy comes from each
// project's README and config facts only.
import { writeFileSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const dir = resolve(".");
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const svg = (f) => readFileSync(f, "utf8");

const P = [
  {
    id: "assever", theme: "dark", bg: "#0B1030", glow: "#3B4BC8", accent: "#F08A24", ink: "#FFFFFF", sub2: "#B9C0EE",
    logo: `<div class="logo-img">${svg("assever-logo.svg")}</div>`,
    kicker: "Purchase integrity for AI agents · India's commerce & payment rails",
    h1: ["Approve once.", "Stays exactly that."],
    sub: "Every purchase stays exactly what you approved: no second basket, no swapped supplier, no extra data share.",
    shot: "assever-shot.webp",
    metric: ["0/144", "unsafe purchases", "36/144 for a budget-only guard · 54/144 unguarded"],
    checks: ["Exact work order, confirmed once", "Money and stock reserved together", "Only a private executor holds credentials"],
    steps: ["Plain-language request", "Exact work order", "Owner confirms once", "Every proposal checked"],
  },
  {
    id: "tasleem", theme: "light", bg: "#EEF4F0", glow: "#9BD3B8", accent: "#006247", ink: "#0E1F18", sub2: "#3E5A4E",
    logo: `<div class="logo-text"><span class="mark" style="background:#006247">T</span>Tasleem</div>`,
    kicker: "Population health · Follow-up after a positive screening test",
    h1: ["Know whether", "follow-up care happened."],
    sub: "Reconciles referral status with clinical evidence, flags the gap and names the clinician who acts next.",
    shot: "tasleem-shot.webp",
    metric: ["99.9%", "of journeys needing action reach a named human", "81.8% for a status-only monitor"],
    checks: ["Median 1.9 days to an alert, vs 16.5", "0 incomplete journeys counted as done", "FHIR R4 and HL7 v2"],
    steps: ["Positive screening test", "Referral status", "Clinical evidence", "Named clinician acts"],
  },
  {
    id: "assay", theme: "dark", bg: "#0E0F14", glow: "#2B5BD7", accent: "#6EA0FF", ink: "#FFFFFF", sub2: "#AEB6C8",
    logo: `<div class="logo-text"><span class="logo-svg">${svg("assay-logo.svg")}</span>Assay</div>`,
    kicker: "AI outcome assurance for video delivery",
    h1: ["Charge only for", "what actually arrived."],
    sub: "Charge only for the AI clips a buyer actually got. Recover the ones that were made but never arrived.",
    shot: "assay-shot.webp",
    metric: ["$40", "captured for 8 verified clips", "from a $50 hold · lost clip recovered · PayPal Sandbox"],
    checks: ["AI reads messages, rules decide actions", "Gemini 25/30 vs keyword baseline 15/30", "75/75 local tests, 0 failed API runs"],
    steps: ["Hold funds", "Generate clips", "Verify delivery", "Capture what arrived"],
  },
  {
    id: "autopilot", theme: "light", bg: "#EEF5F1", glow: "#A7D8C4", accent: "#17695B", ink: "#0F201B", sub2: "#41594F",
    logo: `<div class="logo-text"><span class="logo-svg">${svg("autopilot-mark.svg")}</span>AutoML Autopilot</div>`,
    kicker: "The ML coding agent · Nothing merges automatically",
    h1: ["Checks beyond", "green tests."],
    sub: "A broken ML repository. A reviewable patch. Independent evidence for the code and the model.",
    shot: "autopilot-shot.webp",
    metric: ["3 · 1 · 1", "verified · rejected · inconclusive", "five hosted fixtures, every outcome published"],
    checks: ["Separate verifier grades the patch", "Leakage, parity and protected groups", "398 passing backend tests"],
    steps: ["Broken ML repo", "Agent writes patch", "Independent verifier", "Human merges"],
  },
  {
    id: "patchpilot", theme: "dark", bg: "#0C1016", glow: "#D9622B", accent: "#FF8A4C", ink: "#FFFFFF", sub2: "#B4BCC8",
    logo: `<div class="logo-text"><span class="mark" style="background:#FF8A4C;color:#0C1016">P</span>PatchPilot</div>`,
    kicker: "Best in Track · AI Agents · SerpApi India Hackathon 2026",
    h1: ["API changed.", "Your contract stays."],
    sub: "Finds the official change, proposes a cited repair, and tests what your application must preserve.",
    shot: "pp-demo.png", shot2: "pp-recovery.png",
    metric: ["20/20", "audit cases after repair", "first proposal passed 5/5 tests but only 14/20 audit"],
    checks: [],
    steps: ["Reproduce failure", "Find official change", "Cited repair", "Protected tests + audit"],
  },
];

const css = (p) => `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800&family=JetBrains+Mono:wght@500&display=block');
*{box-sizing:border-box;margin:0}
html,body{width:1672px;height:941px;overflow:hidden}
body{background:${p.bg};color:${p.ink};font-family:'Inter Tight',sans-serif;position:relative}
.glow{position:absolute;inset:0;background:
  radial-gradient(900px 600px at 78% 40%, ${p.glow}${p.theme === "dark" ? "55" : "88"}, transparent 70%),
  radial-gradient(600px 400px at 10% 100%, ${p.glow}${p.theme === "dark" ? "22" : "44"}, transparent 70%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(${p.ink}0d 1px,transparent 1px),linear-gradient(90deg,${p.ink}0d 1px,transparent 1px);background-size:56px 56px;mask-image:radial-gradient(1000px 700px at 70% 45%,#000,transparent 75%)}
.left{position:absolute;left:84px;top:78px;width:720px;z-index:3}
.logo-img svg{height:104px;width:auto}
.logo-text{display:flex;align-items:center;gap:16px;font-weight:800;font-size:46px;letter-spacing:-.03em}
.logo-svg svg{width:56px;height:56px;display:block}
.mark{display:grid;place-items:center;width:56px;height:56px;border-radius:14px;color:#fff;font-size:32px}
.kicker{margin-top:22px;font:500 15px/1.4 'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:${p.sub2}}
h1{margin-top:58px;font-weight:800;font-size:96px;line-height:.98;letter-spacing:-.045em}
h1 em{display:block;font-style:normal;color:${p.accent}}
.sub{margin-top:28px;font-size:24px;line-height:1.45;color:${p.sub2};max-width:600px}
.stage{position:absolute;right:-40px;top:70px;width:960px;height:660px;perspective:1800px;z-index:2}
.shot{position:absolute;border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 50px 120px -30px rgba(0,0,0,${p.theme === "dark" ? ".8" : ".35"}),0 0 0 1px ${p.ink}1f}
.shot img{display:block;width:100%;height:100%;object-fit:cover;object-position:top left}
.main{left:120px;top:40px;width:820px;height:520px;transform:rotateY(-16deg) rotateX(5deg) rotateZ(1deg)}
.second{left:40px;top:330px;width:470px;height:300px;transform:rotateY(-12deg) rotateX(4deg) rotateZ(-2deg)}
.card{position:absolute;border-radius:20px;padding:24px 28px;background:${p.theme === "dark" ? "rgba(18,20,28,.86)" : "rgba(255,255,255,.92)"};backdrop-filter:blur(14px);border:1px solid ${p.ink}22;box-shadow:0 30px 70px -25px rgba(0,0,0,.55)}
.metric{left:60px;top:410px;width:380px;transform:rotateY(-10deg) rotateZ(-2deg)}
.metric b{display:block;font-size:76px;font-weight:800;letter-spacing:-.05em;line-height:1;color:${p.accent}}
.metric span{display:block;margin-top:8px;font-size:21px;font-weight:700}
.metric small{display:block;margin-top:10px;font:500 14px/1.4 'JetBrains Mono',monospace;color:${p.sub2}}
.checks{right:60px;top:450px;width:420px;transform:rotateY(-14deg) rotateZ(1deg)}
.checks li{list-style:none;display:flex;gap:12px;align-items:center;font-size:18px;font-weight:600;padding:9px 0;border-top:1px solid ${p.ink}18}
.checks li:first-child{border-top:0}
.checks i{flex:0 0 22px;height:22px;border-radius:11px;background:${p.accent};display:grid;place-items:center;color:${p.bg};font-style:normal;font-size:14px;font-weight:800}
.steps{position:absolute;left:84px;right:84px;bottom:52px;display:flex;align-items:center;gap:18px;z-index:3}
.step{display:flex;align-items:center;gap:12px;font-size:18px;font-weight:700;white-space:nowrap}
.step n{display:grid;place-items:center;width:34px;height:34px;border-radius:17px;border:2px solid ${p.accent};color:${p.accent};font:500 15px 'JetBrains Mono',monospace}
.arrow{flex:1;height:2px;background:linear-gradient(90deg,${p.accent},${p.accent}33)}
`;

for (const p of P) {
  const second = p.shot2 ? `<figure class="shot second"><img src="${p.shot2}"></figure>` : "";
  const checks = p.checks.length ? `<ul class="card checks">${p.checks.map((c) => `<li><i>✓</i>${c}</li>`).join("")}</ul>` : "";
  const metricPos = p.shot2 ? `style="left:auto;right:40px;top:440px"` : "";
  const steps = p.steps.map((s, i) => `<div class="step"><n>${String(i + 1).padStart(2, "0")}</n>${s}</div>`).join('<div class="arrow"></div>');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css(p)}</style></head><body>
<div class="glow"></div><div class="grid"></div>
<div class="left">${p.logo}<p class="kicker">${p.kicker}</p><h1>${p.h1[0]}<em>${p.h1[1]}</em></h1><p class="sub">${p.sub}</p></div>
<div class="stage"><figure class="shot main"><img src="${p.shot}"></figure>${second}<div class="card metric" ${metricPos}><b>${p.metric[0]}</b><span>${p.metric[1]}</span><small>${p.metric[2]}</small></div>${checks}</div>
<div class="steps">${steps}</div>
</body></html>`;
  const file = resolve(dir, `${p.id}.html`);
  writeFileSync(file, html);
  execFileSync(EDGE, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=1672,941", "--virtual-time-budget=4000", `--screenshot=${resolve(dir, p.id + ".png")}`, "file:///" + file.replace(/\\/g, "/")], { stdio: "ignore" });
  console.log("rendered", p.id);
}
