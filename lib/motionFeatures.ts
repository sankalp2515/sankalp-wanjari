// Framer's animation engine, loaded AFTER first paint (see LazyMotion in
// components/v2/Landing.tsx). First-screen components use the tiny `m`
// component; this chunk adds the animation features asynchronously.
import { domAnimation } from "framer-motion";
export default domAnimation;
