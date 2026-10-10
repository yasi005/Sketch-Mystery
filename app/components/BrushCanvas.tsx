"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DrawHint, WelcomeSplash } from "./Onboarding";
import { inkTile } from "./inkTile";

type Point = { x: number; y: number };

// MIN_WIDTH stays above what the goo threshold would swallow (~1.2× its blur).
const MIN_WIDTH = 8;
const MAX_WIDTH = 40;
// Stroke distance (px) over which the brush ramps from narrow to full width.
const RAMP_DISTANCE = 700;
const COVERAGE_SCALE = 8;
// Coverage (%) at which the page brushes the rest of itself in.
const COMPLETE_AT = 60;
// Self-brush timeline (ms): delay between bands, and one band's sweep.
const FLOOD_STAGGER = 90;
const FLOOD_SWEEP = 1100;
// Peek timeline (ms): ghost brush sweeps, holds, page folds back.
const PEEK_DRAW = 1700;
const PEEK_HOLD = 2600;
const PEEK_FOLD = 3300;

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

// Mineral inks — deep enough for Side B to read, far apart in hue so the
// dock feels like a pigment tray, not eight near-blacks.
const SWATCHES: Swatch[] = [
  { id: "SPEC-01", name: "Graphite", hex: "#14161C", nm: "555nm" },
  { id: "SPEC-02", name: "Lapis", hex: "#0F2A6B", nm: "470nm" },
  { id: "SPEC-03", name: "Viridian", hex: "#0C3D36", nm: "510nm" },
  { id: "SPEC-04", name: "Carmine", hex: "#6E1230", nm: "650nm" },
  { id: "SPEC-05", name: "Amethyst", hex: "#2B0F5C", nm: "400nm" },
  { id: "SPEC-06", name: "Amber", hex: "#5C2E0A", nm: "590nm" },
  { id: "SPEC-07", name: "Cerulean", hex: "#0A3D5C", nm: "490nm" },
  { id: "SPEC-08", name: "Magenta", hex: "#4A1040", nm: "380nm" },
];

// Side A: cool chalk paper + navy chart + coral signal accent.
// Ink turns the page inside out onto Side B (night atlas in paper colour).
const PAPER = "#E6EDF2";
const SEPIA = "#152033";
const TERRA = "#FF6B4A";

function FrontSide() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ color: SEPIA }} aria-hidden>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <g stroke={SEPIA} strokeWidth="0.5" opacity="0.1">
          {Array.from({ length: 11 }, (_, i) => (
            <line key={i} x1={120 * (i + 1)} y1="0" x2={120 * (i + 1)} y2="900" />
          ))}
        </g>
        <circle cx="1060" cy="330" r="190" fill="#B8D4E8" />
        <g stroke={TERRA} strokeWidth="0.8" opacity="0.6">
          <circle cx="1060" cy="330" r="150" />
          <circle cx="1060" cy="330" r="110" strokeDasharray="2 5" />
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i * Math.PI) / 18;
            const r0 = 214;
            const r1 = i % 3 ? 232 : 256;
            return (
              <line
                key={i}
                x1={(1060 + r0 * Math.cos(a)).toFixed(1)}
                y1={(330 + r0 * Math.sin(a)).toFixed(1)}
                x2={(1060 + r1 * Math.cos(a)).toFixed(1)}
                y2={(330 + r1 * Math.sin(a)).toFixed(1)}
              />
            );
          })}
        </g>
        <g stroke={SEPIA} strokeWidth="0.7" opacity="0.55">
          <line x1="0" y1="640" x2="1440" y2="640" />
          <path d="M160 640 Q720 40 1280 640" strokeDasharray="3 7" />
          <path d="M320 640 Q720 240 1120 640" strokeDasharray="1 5" />
        </g>
        <g fill={TERRA}>
          <circle cx="720" cy="340" r="4" />
          <circle cx="428" cy="440" r="3" />
          <circle cx="1012" cy="440" r="3" />
        </g>
        <g fill={SEPIA} fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="0.14em" opacity="0.7">
          <text x="730" y="332">SOLAR NOON 12:04</text>
          <text x="1164" y="620">LAT 35°41′N</text>
          <text x="120" y="620">SUNRISE 06:12</text>
          <text x="1210" y="140">SIDE A</text>
        </g>
      </svg>
      <div className="absolute top-[12%] left-4 right-4 sm:top-[15%] sm:left-7 sm:right-auto md:top-[17%] md:left-10">
        <p className="font-sans text-[clamp(1.85rem,10vw,5.5rem)] leading-[0.88] font-bold tracking-[-0.06em]">
          LUMEN
          <br />
          <span style={{ color: TERRA }}>ATLAS</span>
        </p>
        <p className="mt-3 max-w-[15rem] font-mono text-[9px] leading-relaxed tracking-[0.06em] uppercase opacity-70 sm:mt-4 sm:max-w-[17rem] sm:text-[10px] sm:tracking-[0.08em]">
          Side A — the daylight edition. A reversible page: paint over it to wear it inside out.
        </p>
      </div>
    </div>
  );
}

// Side B, the night atlas: a full-viewport bake of starlight ink with the
// chart printed on it in the paper colour. The brush paints with this image,
// so Side B exists only where the page has been painted, never on Side A.
function drawSideB(c: HTMLCanvasElement, w: number, h: number, dpr: number, hex: string) {
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const g = c.getContext("2d")!;
  g.fillStyle = g.createPattern(inkTile(hex, dpr), "repeat")!;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = g.strokeStyle = PAPER;

  // Chart art lives in a 1440×900 box, cropped to cover like `slice`.
  const s = Math.max(w / 1440, h / 900);
  g.setTransform(dpr * s, 0, 0, dpr * s, (dpr * (w - 1440 * s)) / 2, (dpr * (h - 900 * s)) / 2);
  const stroke = (width: number, alpha: number, path: Path2D, dash: number[] = []) => {
    g.lineWidth = width;
    g.globalAlpha = alpha;
    g.setLineDash(dash);
    g.stroke(path);
  };
  const ring = (rx: number, ry = rx) => {
    const p = new Path2D();
    p.ellipse(720, 450, rx, ry, 0, 0, Math.PI * 2);
    return p;
  };
  for (const r of [210, 320]) stroke(0.6, 0.95, ring(r));
  stroke(0.6, 0.95, ring(410), [2, 6]);
  stroke(0.6, 0.95, ring(520, 180));
  stroke(0.6, 0.95, ring(180, 520));
  stroke(0.6, 0.95, new Path2D("M720 40V860M80 450H1360M220 120L1220 780M1220 120L220 780"));
  stroke(0.45, 0.75, new Path2D("M720 450L980 210L1100 340L920 520ZM720 450L460 680L340 540L540 380Z"));
  for (const [x, y, r] of [[980, 210, 4], [1100, 340, 3], [460, 680, 3.5], [340, 540, 2.5], [540, 380, 3]]) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 0.85;
  g.font = "9px ui-monospace, monospace";
  g.letterSpacing = "1.08px";
  for (const [t, x, y] of [["RA 14h 39m", 250, 160], ["DEC −60° 50′", 1080, 200], ["ORBITAL PLANE 23.4°", 180, 720], ["λ 420–680", 1040, 740]] as const) {
    g.fillText(t, x, y);
  }

  // Editorial type, centred on the viewport in CSS px.
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.textAlign = "center";
  g.textBaseline = "middle";
  const sans = getComputedStyle(document.body).fontFamily;
  const clampPx = (min: number, v: number, max: number) => Math.min(max, Math.max(min, v));
  // Shrinks a size until every line fits the width (mobile).
  const fit = (size: number, weight: number, spacing: number, lines: string[], max: number) => {
    const set = (px: number) => {
      g.font = `${weight} ${px}px ${sans}`;
      g.letterSpacing = `${spacing * px}px`;
    };
    set(size);
    const widest = Math.max(...lines.map((l) => g.measureText(l).width));
    if (widest > max) set((size *= max / widest));
    return size;
  };
  const title = fit(clampPx(40, w * 0.08, 112), 700, -0.06, ["VOID ATLAS"], w - 48);
  const subLine = "SWISS EDITORIAL CARTOGRAPHY OF INVISIBLE ORBITS";
  const sub = clampPx(11.2, w * 0.014, 15.2);
  const body = ["Calibrate the ink. Draw across the field. Typography and wireframes exist on the page at all times —", "they only appear where pigment densifies the ground."];
  const para = clampPx(10.4, w * 0.011, 12.8);
  const top = h / 2 - (title * 0.9 + 12 + sub * 1.6 + 36 + para * 3.4) / 2;

  g.globalAlpha = 1;
  fit(title, 700, -0.06, ["VOID ATLAS"], w - 48);
  g.fillText("VOID ATLAS", w / 2, top + title * 0.45);
  const subY = top + title * 0.9 + 12 + sub * 0.8;
  fit(sub, 500, 0.28, [subLine], w - 48);
  g.fillText(subLine, w / 2, subY);
  g.globalAlpha = 0.95;
  const p = fit(para, 400, 0.04, body, Math.min(672, w - 48));
  body.forEach((l, i) => g.fillText(l, w / 2, subY + sub * 0.8 + 36 + p * (0.85 + 1.7 * i)));
}

export default function BrushCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
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
  const [guide, setGuide] = useState(false);
  const [splash, setSplash] = useState(true);
  const dismissGuide = useCallback(() => setGuide(false), []);

  useEffect(() => {
    colorRef.current = SWATCHES.find((s) => s.id === activeId)?.hex ?? SWATCHES[0].hex;
  }, [activeId]);

  // Welcome splash (typed Hello → Welcome), then peek / draw hint.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Typing Hello (~0.5s) + gap + Welcome (~0.9s) + hold before fade.
    const ms = reduceMotion ? 600 : 3800;
    const t = window.setTimeout(() => setSplash(false), ms);
    return () => window.clearTimeout(t);
  }, []);

  // Paper grain: the ink tile's noise and dust on cream.
  useEffect(() => {
    rootRef.current!.style.backgroundImage = `url(${inkTile(PAPER).toDataURL()})`;
  }, []);

  useEffect(() => {
    if (splash) return;

    const canvas = canvasRef.current!;
    const cursor = cursorRef.current!;
    const ctx = canvas.getContext("2d")!;
    let dpr = 1;
    let stroke: Stroke | null = null;
    let revealRaf = 0;
    const sideB = document.createElement("canvas");
    let ink = { key: "", pattern: null as CanvasPattern | null };

    // Rebaked when the ink or the viewport changes.
    // ponytail: ink laid before a resize keeps Side B at its old layout.
    const inkPattern = () => {
      const key = `${colorRef.current} ${canvas.width}x${canvas.height}`;
      if (ink.key !== key) {
        drawSideB(sideB, window.innerWidth, window.innerHeight, dpr, colorRef.current);
        const pattern = ctx.createPattern(sideB, "no-repeat")!;
        pattern.setTransform(new DOMMatrix().scale(1 / dpr));
        ink = { key, pattern };
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
      if (pct >= COMPLETE_AT && !flooded) runFlood();
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
      inkPattern();
    };

    const clear = () => {
      stopFlood();
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

    const newStroke = (p: Point, maxWidth = MAX_WIDTH): Stroke => {
      stamp(p.x, p.y, MIN_WIDTH);
      return { last: p, distance: 0, width: MIN_WIDTH, maxWidth };
    };

    const beginStroke = (p: Point, maxWidth = MAX_WIDTH) => {
      stroke = newStroke(p, maxWidth);
    };

    // Extends the user's stroke, or `s` for a ghost brush.
    const extendStroke = (p: Point, pressure: number | null, s = stroke) => {
      if (!s) return;
      const dx = p.x - s.last.x;
      const dy = p.y - s.last.y;
      const seg = Math.hypot(dx, dy);
      if (seg < 0.5) return;

      const ramp = 1 - Math.pow(1 - Math.min(1, s.distance / RAMP_DISTANCE), 2);
      const target =
        pressure !== null
          ? MIN_WIDTH + (s.maxWidth - MIN_WIDTH) * pressure * (0.4 + 0.6 * ramp)
          : MIN_WIDTH + (s.maxWidth - MIN_WIDTH) * ramp * (1 - Math.min(0.35, seg / 180));

      const startW = s.width;
      const step = Math.max(0.6, Math.min(startW, target) * 0.22);
      const n = Math.ceil(seg / step);
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        // Slow swell along the stroke so the ink beads and puddles.
        const swell = 1 + 0.22 * Math.sin((s.distance + seg * t) / 26);
        stamp(s.last.x + dx * t, s.last.y + dy * t, (startW + (target - startW) * t) * swell);
      }

      s.distance += seg;
      s.width = startW + (target - startW) * 0.35;
      s.last = p;
    };

    // Past COMPLETE_AT the page finishes turning itself: one ghost brush per
    // band, staggered top to bottom and alternating direction, sweeps the
    // whole viewport with the real brush; then any pinholes are filled.
    let floodRaf = 0;
    let flooded = false;
    const stopFlood = () => {
      cancelAnimationFrame(floodRaf);
      floodRaf = 0;
      flooded = false;
    };

    const runFlood = () => {
      flooded = true;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const width = Math.max(120, Math.min(200, h / 4));
      const band = width * 0.42;
      const brushes = Array.from({ length: Math.ceil(h / band) + 1 }, (_, i) => ({
        start: i * FLOOD_STAGGER,
        s: null as Stroke | null,
        // Starts off-screen so the brush has ramped to full width on entry.
        at: (u: number) => ({
          x: i % 2 ? w * (1.35 - 1.7 * u) : w * (-0.35 + 1.7 * u),
          y: i * band + 14 * Math.sin(u * Math.PI * 2 + i),
        }),
      }));
      const end = (brushes.length - 1) * FLOOD_STAGGER + FLOOD_SWEEP;
      const t0 = performance.now();

      const tick = (now: number) => {
        const t = now - t0;
        for (const b of brushes) {
          if (t < b.start) break;
          const p = b.at(Math.min(1, (t - b.start) / FLOOD_SWEEP));
          if (b.s) extendStroke(p, null, b.s);
          else b.s = newStroke(p, width);
        }
        if (t >= end) {
          ctx.fillStyle = inkPattern();
          ctx.fillRect(0, 0, w, h);
          const cov = coverageRef.current;
          if (cov) {
            cov.grid.fill(1);
            cov.painted = cov.grid.length;
          }
          floodRaf = 0;
        } else {
          floodRaf = requestAnimationFrame(tick);
        }
        publishReveal();
      };
      floodRaf = requestAnimationFrame(tick);
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

    // The peek: a ghost brush sweeps one wave through the middle of the page,
    // turning a slice of it inside out, holds, then the page folds back to
    // Side A and the guide appears.
    let demoRaf = 0;
    const stopDemo = () => {
      cancelAnimationFrame(demoRaf);
      demoRaf = 0;
      canvas.style.transition = canvas.style.opacity = "";
    };

    const runDemo = () => {
      stopDemo();
      clear();
      stroke = null;
      setGuide(false);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const at = (u: number) => ({
        x: w * (0.1 + 0.8 * u),
        y: h * (0.5 + 0.14 * Math.sin(u * Math.PI * 1.6 + 0.6)),
      });
      const start = performance.now();
      beginStroke(at(0), Math.min(110, h * 0.14));

      const tick = (now: number) => {
        const t = now - start;
        if (t < PEEK_DRAW) {
          const u = t / PEEK_DRAW;
          const p = at(u * u * (3 - 2 * u));
          extendStroke(p, null);
          moveCursor(p, true);
        } else if (t < PEEK_FOLD) {
          stroke = null;
          cursor.style.opacity = "0";
          canvas.style.transition = `opacity ${PEEK_FOLD - PEEK_HOLD}ms ease-in`;
          if (t >= PEEK_HOLD) canvas.style.opacity = "0";
        } else {
          clear();
          stopDemo();
          setGuide(true);
          return;
        }
        demoRaf = requestAnimationFrame(tick);
      };
      demoRaf = requestAnimationFrame(tick);
    };

    const penPressure = (e: PointerEvent) =>
      e.pointerType === "pen" && e.pressure > 0 ? e.pressure : null;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (demoRaf) {
        stopDemo();
        clear();
      }
      setGuide(false);
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
        setGuide(true);
      } else if (e.key === "d" || e.key === "D") {
        runDemo();
      } else if (e.key >= "1" && e.key <= "8") {
        setActiveId(SWATCHES[Number(e.key) - 1].id);
      }
    };

    resize();
    // Webfonts may land after first paint; redraw Side B with them.
    document.fonts.ready.then(() => {
      ink.key = "";
      inkPattern();
    });
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    window.addEventListener("keydown", onKey);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Deferred a frame so the state update happens outside the effect body.
    const introFrame = requestAnimationFrame(reduceMotion ? () => setGuide(true) : runDemo);

    return () => {
      cancelAnimationFrame(introFrame);
      cancelAnimationFrame(demoRaf);
      cancelAnimationFrame(floodRaf);
      cancelAnimationFrame(revealRaf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("keydown", onKey);
    };
  }, [splash]);

  return (
    <div
      ref={rootRef}
      className="app-stage fixed inset-0 overflow-hidden select-none"
      style={{ backgroundColor: PAPER }}
    >
      <WelcomeSplash visible={splash} />

      <svg className="absolute h-0 w-0" aria-hidden>
        {/* Gooey metaball: blur, snap alpha back to a hard edge, then lay the
            untouched source (stars and grain) back on top of the fused shape. */}
        <filter id="ink-goo" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -7" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>

      <FrontSide />
      <canvas
        ref={canvasRef}
        style={{ filter: "url(#ink-goo)" }}
        className="absolute inset-0 h-full w-full cursor-none touch-none"
        aria-label="Reversible page. Drag to paint it inside out, C clear, D peek, 1–8 change ink."
      />

      <DrawHint visible={guide && !splash} onDismiss={dismissGuide} />

      {/* Stamped once the page has finished brushing itself in. */}
      <p
        className={`pointer-events-none absolute top-[58%] left-1/2 z-10 -translate-x-1/2 rotate-[-4deg] border border-white/80 px-2.5 py-1 font-mono text-[9px] tracking-[0.22em] text-white transition-all delay-300 duration-700 sm:top-[66%] sm:px-3 sm:text-[10px] sm:tracking-[0.3em] md:top-[72%] ${
          revealed >= 100 ? "scale-100 opacity-100" : "scale-125 opacity-0"
        }`}
        aria-live="polite"
      >
        {revealed >= 100 ? "ATLAS COMPLETE" : ""}
      </p>

      <header className="pointer-events-none absolute top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] z-10 sm:top-[max(1.75rem,env(safe-area-inset-top))] sm:left-[max(1.75rem,env(safe-area-inset-left))] md:top-[max(2.25rem,env(safe-area-inset-top))] md:left-[max(2.5rem,env(safe-area-inset-left))]">
        <h1
          className={`font-sans text-[clamp(0.95rem,3.6vw,1.55rem)] font-bold tracking-[-0.04em] transition-colors duration-[1400ms] ${
            revealed >= COMPLETE_AT ? "text-white" : "text-zinc-900"
          }`}
        >
          EXPLORE THE SPACE
        </h1>
      </header>

      {/* Mobile: top-right under header so it never sits on the dock. */}
      <div
        className={`pointer-events-none absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-10 text-right font-mono text-[8px] leading-relaxed tracking-wider transition-colors duration-[1400ms] sm:text-[9px] md:top-auto md:right-[max(2.5rem,env(safe-area-inset-right))] md:bottom-[max(2rem,env(safe-area-inset-bottom))] md:text-left ${
          revealed >= COMPLETE_AT ? "text-white/70" : "text-zinc-500"
        }`}
        aria-live="polite"
      >
        <p ref={coordsRef}>X: 0 / Y: 0</p>
        <p>REVEALED: {revealed.toFixed(1)}%</p>
      </div>

      <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-20 w-[min(96vw,420px)] -translate-x-1/2 px-1 sm:bottom-[max(1.75rem,env(safe-area-inset-bottom))] sm:w-[min(92vw,420px)] md:bottom-[max(2.25rem,env(safe-area-inset-bottom))]">
        <div className="rounded-sm border border-zinc-900/10 bg-white/55 px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md sm:px-3 sm:py-2.5">
          <div className="flex items-end justify-between gap-0.5 sm:gap-1.5">
            {SWATCHES.map((swatch) => {
              const active = swatch.id === activeId;
              const shortId = swatch.id.replace("SPEC-", "");
              return (
                <button
                  key={swatch.id}
                  type="button"
                  onClick={() => setActiveId(swatch.id)}
                  className="group flex min-h-11 flex-1 flex-col items-center justify-end gap-1 outline-none touch-manipulation sm:min-h-0 sm:gap-1.5"
                  aria-label={`${swatch.name} ${swatch.hex}`}
                  aria-pressed={active}
                >
                  <span
                    className={`block w-2 rounded-[1px] transition-transform duration-200 sm:w-[10px] ${
                      active ? "-translate-y-0.5 h-8 ring-1 ring-zinc-900/40 sm:h-9" : "h-6 sm:h-7"
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <span className="flex flex-col items-center font-mono text-[6px] leading-tight tracking-wide text-zinc-500 sm:text-[7px]">
                    <span className={active ? "text-zinc-800" : ""}>
                      <span className="sm:hidden">{shortId}</span>
                      <span className="hidden sm:inline">{swatch.id}</span>
                    </span>
                    <span className="hidden sm:inline">{swatch.hex}</span>
                    <span className="hidden md:inline">{swatch.nm}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-1.5 text-center font-mono text-[8px] tracking-wide text-zinc-400 sm:mt-2 sm:text-[9px]">
          <span className="sm:hidden">drag · C clear · D peek</span>
          <span className="hidden sm:inline">drag · C clear · D peek · 1–8 ink</span>
        </p>
      </div>

      <div
        ref={cursorRef}
        className="pointer-events-none absolute top-0 left-0 z-30 hidden rounded-full border border-zinc-900 opacity-0 shadow-[0_0_0_1px_rgba(255,255,255,0.8)] transition-opacity duration-150 will-change-transform md:block"
        aria-hidden
      />
    </div>
  );
}
