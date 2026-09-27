"use client";

import { useEffect, useRef, useState } from "react";
import HelloDemo from "./HelloDemo";
import { inkTile } from "./inkTile";

type Point = { x: number; y: number };

// MIN_WIDTH stays above what the goo threshold would swallow (~1.2× its blur).
const MIN_WIDTH = 8;
const MAX_WIDTH = 40;
// Stroke distance (px) over which the brush ramps from narrow to full width.
const RAMP_DISTANCE = 700;
const COVERAGE_SCALE = 8;
// Coverage (%) at which the rest of the field floods in on its own.
const COMPLETE_AT = 60;

type Stroke = {
  last: Point;
  distance: number;
  width: number;
  maxWidth: number;
};

type Swatch = {
  id: string;
  name: string;
  hex: string;
  nm: string;
};

const SWATCHES: Swatch[] = [
  { id: "SPEC-01", name: "Abyssal", hex: "#080808", nm: "420nm" },
  { id: "SPEC-02", name: "Stygian", hex: "#0A1628", nm: "468nm" },
  { id: "SPEC-03", name: "Obsidian", hex: "#0D1A12", nm: "520nm" },
  { id: "SPEC-04", name: "Carbon", hex: "#1A1C1E", nm: "555nm" },
  { id: "SPEC-05", name: "Oxblood", hex: "#3D0F14", nm: "640nm" },
  { id: "SPEC-06", name: "Eclipse", hex: "#1A0F1E", nm: "390nm" },
  { id: "SPEC-07", name: "Peat", hex: "#2A1810", nm: "610nm" },
  { id: "SPEC-08", name: "Monolith", hex: "#2C3034", nm: "480nm" },
];

function RevealLayer() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden text-white [filter:drop-shadow(0_1px_0_rgba(0,0,0,0.07))]"
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <g stroke="#ffffff" strokeWidth="0.6" opacity="0.95">
          <circle cx="720" cy="450" r="210" />
          <circle cx="720" cy="450" r="320" />
          <circle cx="720" cy="450" r="410" strokeDasharray="2 6" />
          <ellipse cx="720" cy="450" rx="520" ry="180" />
          <ellipse cx="720" cy="450" rx="180" ry="520" />
          <line x1="720" y1="40" x2="720" y2="860" />
          <line x1="80" y1="450" x2="1360" y2="450" />
          <line x1="220" y1="120" x2="1220" y2="780" />
          <line x1="1220" y1="120" x2="220" y2="780" />
        </g>
        <g stroke="#ffffff" strokeWidth="0.45" opacity="0.75">
          <path d="M720 450 L980 210 L1100 340 L920 520 Z" />
          <path d="M720 450 L460 680 L340 540 L540 380 Z" />
          <circle cx="980" cy="210" r="4" fill="#ffffff" stroke="none" />
          <circle cx="1100" cy="340" r="3" fill="#ffffff" stroke="none" />
          <circle cx="460" cy="680" r="3.5" fill="#ffffff" stroke="none" />
          <circle cx="340" cy="540" r="2.5" fill="#ffffff" stroke="none" />
          <circle cx="540" cy="380" r="3" fill="#ffffff" stroke="none" />
        </g>
        <g
          fill="#ffffff"
          fontFamily="ui-monospace, monospace"
          fontSize="9"
          letterSpacing="0.12em"
          opacity="0.85"
        >
          <text x="250" y="160">
            RA 14h 39m
          </text>
          <text x="1080" y="200">
            DEC −60° 50′
          </text>
          <text x="180" y="720">
            ORBITAL PLANE 23.4°
          </text>
          <text x="1040" y="740">
            λ 420–680
          </text>
        </g>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8">
        <p className="font-sans text-[clamp(2.5rem,8vw,7rem)] font-bold leading-[0.9] tracking-[-0.06em] text-white">
          VOID ATLAS
        </p>
        <p className="max-w-xl text-center font-sans text-[clamp(0.7rem,1.4vw,0.95rem)] font-medium leading-relaxed tracking-[0.28em] text-white uppercase">
          Swiss editorial cartography of invisible orbits
        </p>
        <p className="mt-6 max-w-2xl text-center font-sans text-[clamp(0.65rem,1.1vw,0.8rem)] leading-[1.7] tracking-[0.04em] text-white/95">
          Calibrate the ink. Draw across the field. Typography and wireframes
          exist on the page at all times — they only appear where pigment densifies
          the ground.
        </p>
      </div>
    </div>
  );
}

export default function BrushCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const floodRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLParagraphElement>(null);
  const colorRef = useRef(SWATCHES[0].hex);
  const coverageRef = useRef<{
    grid: Uint8Array;
    cols: number;
    rows: number;
    painted: number;
  } | null>(null);

  const [activeId, setActiveId] = useState(SWATCHES[0].id);
  const [revealed, setRevealed] = useState(0);
  const [helloRun, setHelloRun] = useState(0);

  useEffect(() => {
    colorRef.current = SWATCHES.find((s) => s.id === activeId)?.hex ?? SWATCHES[0].hex;
    floodRef.current!.style.backgroundImage = `url(${inkTile(colorRef.current).toDataURL()})`;
  }, [activeId]);

  // Paper grain: the ink tile's noise and dust on white.
  useEffect(() => {
    rootRef.current!.style.backgroundImage = `url(${inkTile("#ffffff").toDataURL()})`;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const cursor = cursorRef.current!;
    const ctx = canvas.getContext("2d")!;
    let dpr = 1;
    let stroke: Stroke | null = null;
    let revealRaf = 0;
    let ink = { hex: "", dpr: 0, pattern: null as CanvasPattern | null };

    const inkPattern = () => {
      if (ink.hex !== colorRef.current || ink.dpr !== dpr) {
        const pattern = ctx.createPattern(inkTile(colorRef.current, dpr), "repeat")!;
        pattern.setTransform(new DOMMatrix().scale(1 / dpr));
        ink = { hex: colorRef.current, dpr, pattern };
      }
      return ink.pattern!;
    };

    const syncCoverageSize = (cssW: number, cssH: number) => {
      const cols = Math.max(1, Math.ceil(cssW / COVERAGE_SCALE));
      const rows = Math.max(1, Math.ceil(cssH / COVERAGE_SCALE));
      const prev = coverageRef.current;
      if (prev && prev.cols === cols && prev.rows === rows) return;
      coverageRef.current = {
        grid: new Uint8Array(cols * rows),
        cols,
        rows,
        painted: 0,
      };
      setRevealed(0);
    };

    const markCoverage = (x: number, y: number, width: number) => {
      const cov = coverageRef.current;
      if (!cov) return;
      const r = width / 2;
      const minC = Math.max(0, Math.floor((x - r) / COVERAGE_SCALE));
      const maxC = Math.min(cov.cols - 1, Math.floor((x + r) / COVERAGE_SCALE));
      const minR = Math.max(0, Math.floor((y - r) / COVERAGE_SCALE));
      const maxR = Math.min(cov.rows - 1, Math.floor((y + r) / COVERAGE_SCALE));
      for (let row = minR; row <= maxR; row++) {
        for (let col = minC; col <= maxC; col++) {
          const i = row * cov.cols + col;
          if (cov.grid[i]) continue;
          const cx = (col + 0.5) * COVERAGE_SCALE;
          const cy = (row + 0.5) * COVERAGE_SCALE;
          if ((cx - x) ** 2 + (cy - y) ** 2 <= (r + COVERAGE_SCALE * 0.6) ** 2) {
            cov.grid[i] = 1;
            cov.painted++;
          }
        }
      }
    };

    const publishReveal = () => {
      const cov = coverageRef.current;
      if (!cov) return;
      const pct = (cov.painted / (cov.cols * cov.rows)) * 100;
      setRevealed(Math.min(100, pct));
    };

    const resize = () => {
      const snapshot = document.createElement("canvas");
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      if (canvas.width && canvas.height) snapshot.getContext("2d")!.drawImage(canvas, 0, 0);

      dpr = window.devicePixelRatio || 1;
      const cssW = window.innerWidth;
      const cssH = window.innerHeight;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(snapshot, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      syncCoverageSize(cssW, cssH);
    };

    const clear = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      const cov = coverageRef.current;
      if (cov) {
        cov.grid.fill(0);
        cov.painted = 0;
      }
      setRevealed(0);
    };

    // Plain discs of pattern-filled ink; the #ink-goo filter on the canvas
    // fuses them into crisp-edged metaballs.
    const stamp = (x: number, y: number, width: number) => {
      ctx.fillStyle = inkPattern();
      ctx.beginPath();
      ctx.arc(x, y, width / 2, 0, Math.PI * 2);
      ctx.fill();
      markCoverage(x, y, width);
    };

    const beginStroke = (p: Point, maxWidth = MAX_WIDTH) => {
      stroke = { last: p, distance: 0, width: MIN_WIDTH, maxWidth };
      stamp(p.x, p.y, MIN_WIDTH);
    };

    const extendStroke = (p: Point, pressure: number | null) => {
      if (!stroke) return;
      const dx = p.x - stroke.last.x;
      const dy = p.y - stroke.last.y;
      const seg = Math.hypot(dx, dy);
      if (seg < 0.5) return;

      const ramp = 1 - Math.pow(1 - Math.min(1, stroke.distance / RAMP_DISTANCE), 2);
      const target =
        pressure !== null
          ? MIN_WIDTH + (stroke.maxWidth - MIN_WIDTH) * pressure * (0.4 + 0.6 * ramp)
          : MIN_WIDTH + (stroke.maxWidth - MIN_WIDTH) * ramp * (1 - Math.min(0.35, seg / 180));

      const startW = stroke.width;
      const step = Math.max(0.6, Math.min(startW, target) * 0.22);
      const n = Math.ceil(seg / step);
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        // Slow swell along the stroke so the ink beads and puddles.
        const swell = 1 + 0.22 * Math.sin((stroke.distance + seg * t) / 26);
        stamp(stroke.last.x + dx * t, stroke.last.y + dy * t, (startW + (target - startW) * t) * swell);
      }

      stroke.distance += seg;
      stroke.width = startW + (target - startW) * 0.35;
      stroke.last = p;
    };

    const endStroke = () => {
      stroke = null;
      publishReveal();
    };

    const moveCursor = (p: Point, pressed: boolean) => {
      // Ring matches the live brush width while drawing, full width on hover.
      const size = pressed && stroke ? stroke.width : MAX_WIDTH;
      cursor.style.transform = `translate(${p.x - size / 2}px, ${p.y - size / 2}px)`;
      cursor.style.width = cursor.style.height = `${size}px`;
      cursor.style.opacity = "1";
      // Written straight to the DOM: a React re-render per pointermove is jank.
      coordsRef.current!.textContent = `X: ${Math.round(p.x)} / Y: ${Math.round(p.y)}`;
    };

    // The "hello" demo lives in its own SVG layer (HelloDemo), so it can
    // fade out on its own without touching what the user has painted.
    const stopDemo = () => setHelloRun(0);

    const runDemo = () => {
      clear();
      endStroke();
      setHelloRun((n) => n + 1);
    };

    const penPressure = (e: PointerEvent) =>
      e.pointerType === "pen" && e.pressure > 0 ? e.pressure : null;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      stopDemo();
      canvas.setPointerCapture(e.pointerId);
      beginStroke({ x: e.clientX, y: e.clientY });
      moveCursor({ x: e.clientX, y: e.clientY }, true);
    };

    const onMove = (e: PointerEvent) => {
      const pressed = stroke !== null;
      const events = pressed && e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of events.length ? events : [e]) {
        extendStroke({ x: ev.clientX, y: ev.clientY }, penPressure(ev));
      }
      if (e.pointerType === "touch") cursor.style.opacity = "0";
      else moveCursor({ x: e.clientX, y: e.clientY }, pressed);
      if (pressed) {
        cancelAnimationFrame(revealRaf);
        revealRaf = requestAnimationFrame(publishReveal);
      }
    };

    const onUp = (e: PointerEvent) => {
      endStroke();
      if (e.pointerType !== "touch") moveCursor({ x: e.clientX, y: e.clientY }, false);
    };

    const onLeave = () => {
      if (!stroke) cursor.style.opacity = "0";
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "c" || e.key === "C") {
        stopDemo();
        clear();
      } else if (e.key === "d" || e.key === "D") {
        runDemo();
      } else if (e.key >= "1" && e.key <= "8") {
        setActiveId(SWATCHES[Number(e.key) - 1].id);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    window.addEventListener("keydown", onKey);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Deferred a frame so the state update happens outside the effect body.
    const introFrame = reduceMotion ? 0 : requestAnimationFrame(runDemo);

    return () => {
      cancelAnimationFrame(introFrame);
      cancelAnimationFrame(revealRaf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="fixed inset-0 overflow-hidden bg-white select-none">
      <svg className="absolute h-0 w-0" aria-hidden>
        {/* Gooey metaball: blur, snap alpha back to a hard edge, then lay the
            untouched source (stars and grain) back on top of the fused shape. */}
        <filter id="ink-goo" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -7" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>

      <canvas
        ref={canvasRef}
        style={{ filter: "url(#ink-goo)" }}
        className="absolute inset-0 h-full w-full cursor-none touch-none"
        aria-label="Ink reveal canvas. Drag to paint, C clear, D demo, 1–8 change ink."
      />

      <HelloDemo run={helloRun} color={SWATCHES.find((s) => s.id === activeId)?.hex ?? SWATCHES[0].hex} />

      {/* Past COMPLETE_AT the rest of the ink floods in; clearing drains it. */}
      <div
        ref={floodRef}
        className={`pointer-events-none absolute inset-0 bg-[length:256px] transition-opacity duration-[1400ms] ease-out ${
          revealed >= COMPLETE_AT ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />
      <RevealLayer />
      <p
        className={`pointer-events-none absolute top-[72%] left-1/2 z-10 -translate-x-1/2 rotate-[-4deg] border border-white/80 px-3 py-1 font-mono text-[10px] tracking-[0.3em] text-white transition-all delay-700 duration-700 ${
          revealed >= COMPLETE_AT ? "scale-100 opacity-100" : "scale-125 opacity-0"
        }`}
        aria-live="polite"
      >
        {revealed >= COMPLETE_AT ? "ATLAS COMPLETE" : ""}
      </p>

      <header className="pointer-events-none absolute top-7 left-7 z-10 md:top-9 md:left-10">
        <h1 className="font-sans text-[clamp(1.05rem,2.2vw,1.55rem)] font-bold tracking-[-0.04em] text-zinc-900">
          EXPLORE THE SPACE
        </h1>
      </header>

      <div
        className="pointer-events-none absolute right-6 bottom-6 z-10 font-mono text-[9px] leading-relaxed tracking-wider text-zinc-500 md:right-10 md:bottom-8"
        aria-live="polite"
      >
        <p ref={coordsRef}>X: 0 / Y: 0</p>
        <p>REVEALED: {revealed.toFixed(1)}%</p>
      </div>

      <div className="absolute bottom-7 left-1/2 z-20 w-[min(92vw,420px)] -translate-x-1/2 md:bottom-9">
        <div className="rounded-sm border border-zinc-900/10 bg-white/55 px-3 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md">
          <div className="flex items-end justify-between gap-1.5">
            {SWATCHES.map((swatch) => {
              const active = swatch.id === activeId;
              return (
                <button
                  key={swatch.id}
                  type="button"
                  onClick={() => setActiveId(swatch.id)}
                  className="group flex flex-1 flex-col items-center gap-1.5 outline-none"
                  aria-label={`${swatch.name} ${swatch.hex}`}
                  aria-pressed={active}
                >
                  <span
                    className={`block w-[10px] rounded-[1px] transition-transform duration-200 ${
                      active ? "-translate-y-0.5 h-9 ring-1 ring-zinc-900/40" : "h-7"
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <span className="flex flex-col items-center font-mono text-[7px] leading-tight tracking-wide text-zinc-500">
                    <span className={active ? "text-zinc-800" : ""}>{swatch.id}</span>
                    <span className="hidden sm:inline">{swatch.hex}</span>
                    <span className="hidden md:inline">{swatch.nm}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-2 text-center font-mono text-[9px] tracking-wide text-zinc-400">
          drag · C clear · D demo · 1–8 ink
        </p>
      </div>

      <div
        ref={cursorRef}
        className="pointer-events-none absolute top-0 left-0 z-30 rounded-full border border-white opacity-0 mix-blend-difference transition-opacity duration-150 will-change-transform"
        aria-hidden
      />
    </div>
  );
}
