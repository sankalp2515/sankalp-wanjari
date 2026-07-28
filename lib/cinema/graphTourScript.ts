// ── Graph-mode guided tour (data only) ──────────────────────────
// The evolution, not the categories — education → research → enterprise
// engineering → production AI → product thinking → the whole system, each line
// explaining WHY the next thing follows from the last. Narrated by Helios
// (the guide); captions carry it when sound is off.
//
// Kept in its own dependency-free module (no React, no three.js) so the build
// script that pre-generates the audio can import these lines without pulling in
// the whole GraphMode component.

export interface GraphStep {
  /** Node the camera flies to, and the subgraph that lights up. */
  nodeId: string;
  say: string;
  /** Minimum dwell (ms) when there is no voice; real dwell scales with length. */
  holdMs: number;
  /** Pull back to see the whole lit system instead of framing one node. */
  overview?: boolean;
}

export const GRAPH_TOUR: GraphStep[] = [
  {
    nodeId: "me",
    say: "Every résumé is a list. This is the same career drawn as a system — and systems can be traced. Follow one line.",
    holdMs: 4000,
    overview: true,
  },
  {
    nodeId: "hub-education",
    say: "It starts here, because everything downstream inherits from it. AI/ML honours engineering, then an executive product programme.",
    holdMs: 4200,
  },
  {
    nodeId: "hub-research",
    say: "The honours track led straight to publication. Two peer-reviewed papers — and their edges don't stop at the journal. They feed capabilities still in use.",
    holdMs: 4600,
  },
  {
    nodeId: "hub-career",
    say: "Then three years of bank data migrations at FIS. That teaches one thing: systems fail. It's why the AI work has circuit breakers instead of hope.",
    holdMs: 4600,
  },
  {
    nodeId: "hub-work",
    say: "So the work looks like this. Six production systems, each wired to the capability it proves — and to the evaluation edges that back it with tests, not adjectives.",
    holdMs: 4800,
  },
  {
    nodeId: "cap-product",
    say: "And this node is the difference between an engineer and an AI product engineer: deciding what is worth building is a capability too, with edges of its own.",
    holdMs: 4600,
  },
  {
    nodeId: "me",
    say: "Education holds up research. Research holds up capability. Capability holds up the work — and the work points back here. Nothing on this map stands alone. Click any node to see why.",
    holdMs: 5600,
    overview: true,
  },
];
