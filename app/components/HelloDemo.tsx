"use client";

import { useEffect, useRef } from "react";
import { inkTile } from "./inkTile";

type Point = { x: number; y: number };

// Timeline (ms): trace the word, hold, then dissolve.
const DRAW_END = 3800;
const FADE_START = 5100;
const FADE_END = 5800;

// Forward slant of the script, in degrees.
const SLANT = 12;
// Monoline stroke weight of the white cut, in x-heights.
const STROKE = 0.09;
// Width of the dark ink puddle the word is cut through, in x-heights.
const PUDDLE = 0.62;
// Extra "time" spent per radian of turning, in x-heights. Makes the pen
// ease off around loops and run through the straights, like a real hand.
const TURN_COST = 0.12;

// Cursive "hello" as one continuous pen path. Units: baseline at y=0,
// x-height at 1, loop tops at ~2 (y points up).
const HELLO: [number, number][] = [
  // lead-in + h
  [-0.1, 0.1], [0.2, 0.7], [0.45, 1.5], [0.55, 1.95], [0.45, 2.1], [0.32, 1.9],
  [0.28, 1.2], [0.26, 0.5], [0.24, 0],
  [0.34, 0.55], [0.55, 0.9], [0.75, 0.8], [0.8, 0.4], [0.84, 0.08], [1.0, 0.02],
  // e
  [1.2, 0.3], [1.44, 0.58], [1.42, 0.85], [1.28, 0.86], [1.14, 0.6], [1.18, 0.15],
  [1.38, 0], [1.58, 0.12],
  // l
  [1.82, 0.8], [2.02, 1.6], [2.02, 2.05], [1.88, 2.02], [1.8, 1.5], [1.8, 0.6],
  [1.86, 0.1], [2.02, 0], [2.2, 0.14],
  // l
  [2.44, 0.8], [2.64, 1.6], [2.64, 2.05], [2.5, 2.02], [2.42, 1.5], [2.42, 0.6],
  [2.48, 0.1], [2.64, 0], [2.84, 0.2],
  // o + upward exit flick
  [3.02, 0.62], [3.2, 0.9], [3.3, 0.96], [3.14, 0.9], [2.98, 0.55], [3.03, 0.14],
  [3.2, 0.01], [3.38, 0.16], [3.44, 0.55], [3.36, 0.88], [3.26, 0.95], [3.42, 0.86],
  [3.66, 0.8], [3.92, 0.98],
];

// Slant the points, flip to SVG's y-down, then join them with Catmull-Rom
// splines written out as cubic Béziers. Also sample the curve to build a
// lookup from "pen time" to arc-length fraction.
const hello = (() => {
  const shear = Math.tan((SLANT * Math.PI) / 180);
  const P: Point[] = HELLO.map(([x, y]) => ({ x: x + y * shear, y: 2.1 - y }));

  let d = `M${P[0].x.toFixed(3)} ${P[0].y.toFixed(3)}`;
  const samples: Point[] = [P[0]];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)];
    const p1 = P[i];
    const p2 = P[i + 1];
    const p3 = P[Math.min(P.length - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x.toFixed(3)} ${c1.y.toFixed(3)} ${c2.x.toFixed(3)} ${c2.y.toFixed(3)} ${p2.x.toFixed(3)} ${p2.y.toFixed(3)}`;
    for (let j = 1; j <= 16; j++) {
      const t = j / 16;
      const u = 1 - t;
      const b = (a: number, e: number, f: number, g: number) =>
        u * u * u * a + 3 * u * u * t * e + 3 * u * t * t * f + t * t * t * g;
      samples.push({ x: b(p1.x, c1.x, c2.x, p2.x), y: b(p1.y, c1.y, c2.y, p2.y) });
    }
  }

  // Cumulative arc length and cumulative pen time (length + turning cost).
  const length = [0];
  const time = [0];
  for (let i = 1; i < samples.length; i++) {
    const dx = samples[i].x - samples[i - 1].x;
    const dy = samples[i].y - samples[i - 1].y;
    let turn = 0;
    if (i > 1) {
      const a0 = Math.atan2(samples[i - 1].y - samples[i - 2].y, samples[i - 1].x - samples[i - 2].x);
      turn = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - a0), Math.cos(Math.atan2(dy, dx) - a0)));
    }
    const ds = Math.hypot(dx, dy);
    length.push(length[i - 1] + ds);
    time.push(time[i - 1] + ds + TURN_COST * turn);
  }

  const pad = PUDDLE;
  const xs = samples.map((p) => p.x);
  const ys = samples.map((p) => p.y);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const viewBox = `${minX.toFixed(3)} ${minY.toFixed(3)} ${(Math.max(...xs) + pad - minX).toFixed(3)} ${(Math.max(...ys) + pad - minY).toFixed(3)}`;

  return { d, length, time, viewBox, minX, maxX: Math.max(...xs) + pad };
})();

// Fraction of the path drawn after fraction u of the pen's time.
function drawnFraction(u: number) {
  const { length, time } = hello;
  const target = u * time[time.length - 1];
  let i = 1;
  while (i < time.length - 1 && time[i] < target) i++;
  const k = (target - time[i - 1]) / (time[i] - time[i - 1] || 1);
  return (length[i - 1] + (length[i] - length[i - 1]) * k) / length[length.length - 1];
}

// CSS cubic-bezier(x1, y1, x2, y2) timing function.
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const ax = 1 + 3 * x1 - 3 * x2;
  const bx = 3 * x2 - 6 * x1;
  const cx = 3 * x1;
  const ay = 1 + 3 * y1 - 3 * y2;
  const by = 3 * y2 - 6 * y1;
  const cy = 3 * y1;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const err = ((ax * t + bx) * t + cx) * t - x;
      const slope = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(slope) < 1e-6) break;
      t -= err / slope;
    }
    t = Math.min(1, Math.max(0, t));
    return ((ay * t + by) * t + cy) * t;
  };
}

const ease = cubicBezier(0.25, 0.1, 0.25, 1);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Ink tile edge in viewBox units, sized for the widest (620px) layout.
const TILE = ((hello.maxX - hello.minX) * 256) / 620;

/**
 * "hello" as a negative cut: a fat puddle of starlight ink and a white
 * monoline word traced together with stroke trimming (dashoffset 1 → 0 on a
 * normalised path length, inherited by both paths), held, then faded out
 * while scaling to 96%.
 * `run` restarts the animation whenever it changes; 0 hides it.
 */
export default function HelloDemo({ run, color }: { run: number; color: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const penRef = useRef<SVGGElement>(null);
  const texRef = useRef<SVGImageElement>(null);

  useEffect(() => {
    texRef.current!.setAttribute("href", inkTile(color).toDataURL());
  }, [color]);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const pen = penRef.current!;
    wrap.style.opacity = "0";
    if (!run) return;

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = now - start;

      const f = drawnFraction(ease(clamp01(t / DRAW_END)));
      pen.style.strokeDashoffset = String(1 - f);
      // Hidden until the pen touches down, so no round-cap dot shows early.
      pen.style.visibility = f > 0 ? "visible" : "hidden";

      const fade = ease(clamp01((t - FADE_START) / (FADE_END - FADE_START)));
      wrap.style.opacity = String(1 - fade);
      wrap.style.transform = `translate(-50%, -50%) scale(${1 - 0.04 * fade})`;

      if (t < FADE_END) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run]);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute top-[45%] left-1/2 opacity-0"
      style={{ width: "clamp(220px, 40vw, 620px)", transform: "translate(-50%, -50%)" }}
      aria-hidden
    >
      <svg viewBox={hello.viewBox} className="block h-auto w-full max-h-[40vh] overflow-visible" fill="none">
        <defs>
          <pattern id="hello-ink" patternUnits="userSpaceOnUse" width={TILE} height={TILE}>
            <image ref={texRef} width={TILE} height={TILE} preserveAspectRatio="none" />
          </pattern>
          {/* Same metaball trick as #ink-goo, in viewBox units. */}
          <filter id="hello-goo" x="-30%" y="-40%" width="160%" height="180%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.06" result="blur" />
            <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -7" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
        <g
          ref={penRef}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 1"
          strokeDashoffset={1}
        >
          <path d={hello.d} pathLength={1} stroke="url(#hello-ink)" strokeWidth={PUDDLE} filter="url(#hello-goo)" />
          <path d={hello.d} pathLength={1} stroke="#ffffff" strokeWidth={STROKE} />
        </g>
      </svg>
    </div>
  );
}
