"use client";

// PosterDistort — project images ripple and split into colour channels under
// the cursor (FX_DISTORT, config/awardPass.ts).
//
// One WebGL canvas for the whole page, created on the first hover. On hover it
// is moved INTO the hovered frame, right after the image or video, so it
// inherits the frame's radius, transforms (the 3D ring) and stacking: labels
// and stamps that sit on top of the image stay on top. It draws the same
// picture (object-fit: cover) with a ripple around the cursor whose strength
// follows pointer speed, then fades out and detaches on leave. Videos keep
// playing through it (the frame is re-uploaded each tick).
//
// Mouse only; reduced motion and touch never load WebGL.

import { useEffect } from "react";

const FRAMES = ".dfilm__frame, .csx__visual, .ribbon__card.is-front, .rsig__poster, .pcard__poster";

const VERT = `attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `precision mediump float;
varying vec2 v;
uniform sampler2D tex;
uniform vec2 scale, offset, mouse;
uniform float t, amt, aspect;
vec4 pick(vec2 uv){ return texture2D(tex, offset + uv * scale); }
void main(){
  vec2 uv = vec2(v.x, 1. - v.y);
  vec2 d = uv - mouse; d.x *= aspect;
  float r = length(d);
  float wave = sin(r * 38. - t * 7.) * exp(-r * 5.5);
  vec2 dir = r > .0001 ? d / r : vec2(0.);
  dir.x /= aspect;
  vec2 o = dir * wave * .026 * amt;
  float lens = exp(-r * r * 22.) * .045 * amt;
  vec2 base = uv - dir * lens;
  float cr = pick(base + o * 1.6).r;
  float cg = pick(base + o).g;
  float cb = pick(base + o * .45).b;
  gl_FragColor = vec4(cr, cg, cb, 1.);
}`;

export default function PosterDistort() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce), (hover: none), (pointer: coarse)").matches) return;

    let cv: HTMLCanvasElement | null = null;
    let gl: WebGLRenderingContext | null = null;
    let prog: WebGLProgram | null = null;
    let texture: WebGLTexture | null = null;
    const u: Record<string, WebGLUniformLocation | null> = {};
    let frame: HTMLElement | null = null;
    let media: HTMLImageElement | HTMLVideoElement | null = null;
    // A video with no decoded frame yet (not played) is drawn from its poster.
    const posters = new Map<string, HTMLImageElement>();
    const posterFor = (v: HTMLVideoElement) => {
      const src = v.poster; if (!src) return null;
      let im = posters.get(src);
      if (!im) { im = new Image(); im.src = src; posters.set(src, im); }
      return im.complete && im.naturalWidth ? im : null;
    };
    let raf = 0, t0 = 0;
    const m = { x: .5, y: .5, tx: .5, ty: .5 };
    let amt = 0, tgtAmt = 0, speed = 0, lastX = 0, lastY = 0, broken = false;

    const init = () => {
      if (gl || broken) return !!gl;
      cv = document.createElement("canvas");
      cv.className = "fx-distort__cv";
      cv.setAttribute("aria-hidden", "true");
      gl = cv.getContext("webgl", { premultipliedAlpha: false, antialias: false, alpha: false });
      if (!gl) { broken = true; return false; }
      const sh = (type: number, src: string) => { const s = gl!.createShader(type)!; gl!.shaderSource(s, src); gl!.compileShader(s); return s; };
      prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { broken = true; return false; }
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      for (const n of ["scale", "offset", "mouse", "t", "amt", "aspect"]) u[n] = gl.getUniformLocation(prog, n);
      return true;
    };

    const upload = () => {
      if (!gl || !media) return false;
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, media);
        return true;
      } catch { return false; }
    };

    // object-fit: cover, in texture space.
    const cover = (w: number, h: number) => {
      const nw = media instanceof HTMLVideoElement ? media.videoWidth : media!.naturalWidth;
      const nh = media instanceof HTMLVideoElement ? media.videoHeight : media!.naturalHeight;
      if (!nw || !nh) return { sx: 1, sy: 1, ox: 0, oy: 0 };
      const ra = w / h, ri = nw / nh;
      return ra > ri ? { sx: 1, sy: ri / ra, ox: 0, oy: (1 - ri / ra) / 2 } : { sx: ra / ri, sy: 1, ox: (1 - ra / ri) / 2, oy: 0 };
    };

    // Some GPUs/drivers hand WebGL an empty frame for <video>. Draw once
    // undistorted and sample a few pixels; an all-black read means this video
    // can't be used, so it is skipped from then on (never a black flash).
    const badVideos = new WeakSet<HTMLVideoElement>();
    const videoReadable = (w: number, h: number) => {
      if (!gl) return false;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.scale, 1, 1); gl.uniform2f(u.offset, 0, 0); gl.uniform2f(u.mouse, .5, .5);
      gl.uniform1f(u.t, 0); gl.uniform1f(u.amt, 0); gl.uniform1f(u.aspect, w / Math.max(1, h));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      const px = new Uint8Array(4);
      for (const [fx, fy] of [[.5, .5], [.25, .3], [.75, .3], [.25, .7], [.75, .7]]) {
        gl.readPixels(Math.floor(w * fx), Math.floor(h * fy), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        if (px[0] + px[1] + px[2] > 12) return true;
      }
      return false;
    };

    const detach = () => {
      cancelAnimationFrame(raf); raf = 0;
      cv?.remove();
      frame = null; media = null;
    };

    const tick = (now: number) => {
      if (!gl || !cv || !media || !frame) return;
      m.x += (m.tx - m.x) * .16; m.y += (m.ty - m.y) * .16;
      speed *= .92;
      tgtAmt = frame.matches(":hover") ? Math.min(1, .45 + speed * .06) : 0;
      amt += (tgtAmt - amt) * .08;
      cv.style.opacity = String(Math.min(1, amt * 3));
      if (media instanceof HTMLVideoElement && !media.paused) upload();
      const w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr()) || cv.height !== Math.round(h * dpr())) {
        cv.width = Math.round(w * dpr()); cv.height = Math.round(h * dpr());
        gl.viewport(0, 0, cv.width, cv.height);
      }
      const c = cover(w, h);
      gl.uniform2f(u.scale, c.sx, c.sy);
      gl.uniform2f(u.offset, c.ox, c.oy);
      gl.uniform2f(u.mouse, m.x, m.y);
      gl.uniform1f(u.t, (now - t0) / 1000);
      gl.uniform1f(u.amt, amt);
      gl.uniform1f(u.aspect, w / Math.max(1, h));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (tgtAmt === 0 && amt < .01) { detach(); return; }
      raf = requestAnimationFrame(tick);
    };
    const dpr = () => Math.min(1.5, window.devicePixelRatio || 1);

    const attach = (f: HTMLElement) => {
      const md = f.querySelector<HTMLImageElement | HTMLVideoElement>(".ribbon__face:not(.ribbon__face--back) img, video, img");
      if (!md) return;
      let src: HTMLImageElement | HTMLVideoElement = md;
      if (md instanceof HTMLVideoElement && badVideos.has(md)) return;
      if (md instanceof HTMLVideoElement && md.readyState < 2) {
        const p = posterFor(md); if (!p) return;
        src = p;
      }
      if (src instanceof HTMLImageElement && !(src.complete && src.naturalWidth)) return;
      if (!init()) return;
      if (frame !== f || media !== src) {
        frame = f; media = src;
        if (!upload()) { detach(); return; }
        if (src instanceof HTMLVideoElement) {
          cv!.width = Math.max(1, Math.round(md.offsetWidth * dpr())); cv!.height = Math.max(1, Math.round(md.offsetHeight * dpr()));
          if (!videoReadable(cv!.width, cv!.height)) { badVideos.add(src); detach(); return; }
        }
        // Sit exactly over the media element, just above it in the frame.
        const host = md.parentElement!;
        cv!.style.left = `${md.offsetLeft}px`; cv!.style.top = `${md.offsetTop}px`;
        cv!.style.width = `${md.offsetWidth}px`; cv!.style.height = `${md.offsetHeight}px`;
        cv!.style.borderRadius = getComputedStyle(md).borderRadius;
        host.insertBefore(cv!, md.nextSibling);
        amt = 0;
      }
      if (!raf) { t0 = t0 || performance.now(); raf = requestAnimationFrame(tick); }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const f = (e.target as Element | null)?.closest?.<HTMLElement>(FRAMES);
      if (!f) return;
      speed += Math.hypot(e.clientX - lastX, e.clientY - lastY);
      lastX = e.clientX; lastY = e.clientY;
      if (f !== frame) attach(f);
      if (!cv || frame !== f) return;
      const r = cv.getBoundingClientRect();
      m.tx = (e.clientX - r.left) / Math.max(1, r.width);
      m.ty = (e.clientY - r.top) / Math.max(1, r.height);
      if (amt < .02) { m.x = m.tx; m.y = m.ty; }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      detach();
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return null;
}
