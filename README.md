# Brushiing

**Paint the white. Uncover the space.**

A full-viewport ink canvas where a textured brush stroke is the only light switch —
Swiss editorial type and orbital wireframes sit camouflaged on pure white until pigment densifies the ground.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-MIT-f4a582)](./LICENSE)

---

## First, the vibe

Most drawing demos are a black canvas and a brush that proves you can draw a line.

This one is an **empty museum wall**.

Typography and blueprints are already on the page — white on white, invisible by design.
You don't add content. You **reveal** it. The stroke is matte, granular, a little brutal.
A frosted calibration dock sits at the bottom like a lab instrument, not a paint picker.
Coordinates tick in the corner. Coverage percentage climbs as ink lands.

Atmosphere before chrome. The reveal before the UI. If it feels like a productivity tool, I missed.
If it feels like something you might linger over with one finger on the trackpad — I landed.

---

## The experience

| | |
|:--|:--|
| **Drag** | Paint textured ink across the field |
| **The peek** | On load a ghost brush turns a slice of the page inside out, then it folds back and a guide invites you to draw |
| **Calibration dock** | Eight deep, desaturated inks — abyssal through monolith zinc |
| **Keys `1`–`8`** | Jump straight to a swatch |
| **`C` / `D`** | Clear the field · replay the peek |
| **Telemetry** | Live `X / Y` and `REVEALED %` in the corner |

Respects `prefers-reduced-motion` — the intro stays quiet when asked.

---

## How the reveal works

The page is reversible, like a jacket with two sides.

1. **Side A** — a sunlit day chart on cream paper — is printed under the canvas  
2. **Side B** — the night atlas — is baked once into a full-viewport image: starlight ink with the chart printed on it in the paper colour  
3. The brush paints *with that image*, so Side B exists only where you paint, never on Side A  
4. A coarse coverage grid samples painted cells to drive **REVEALED %**; past 60% the rest floods in

The brush is a chain of discs filled with a tiled "starlight ink" texture — matte
pigment, lithographic noise, risograph grit, pinprick stars. A gooey SVG filter (blur →
alpha threshold → source back on top) fuses overlapping arcs into crisp-edged metaballs.
Width ramps with stroke distance (and real stylus pressure when you have it) and swells
gently along the way, so the ink beads and puddles.

---

## Run locally

Requires **Node 18+**.

```bash
git clone https://github.com/yasi005/brushiing.git
cd brushiing
npm install
npm run dev
```

Open **[localhost:3000](http://localhost:3000)** and draw when you are ready.

> **No environment variables, no API keys, no database.** The whole piece runs client-side.
> Clone and go.

<details>
<summary>Other scripts</summary>

| Command | What it does |
|:--|:--|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

</details>

---

## How it's put together

```
app/
├── components/
│   ├── BrushCanvas.tsx   # both sides, ink, peek, dock, telemetry, pointer input
│   └── inkTile.ts        # starlight ink texture tile
├── globals.css
├── layout.tsx
└── page.tsx
```

One screen. One job. The peek drives the real brush, so the intro is exactly
what drawing does.

---

## Deploy

A Next.js app — no environment variables, no server secrets to manage.

Push the repository to GitHub, import it on [Vercel](https://vercel.com/new), and deploy.

Sanity-check locally first:

```bash
npm run build && npm run start
```

---

## Built with

[Next.js 16](https://nextjs.org) · [React 19](https://react.dev) ·
[TypeScript](https://www.typescriptlang.org) · [Tailwind CSS v4](https://tailwindcss.com) ·
Canvas 2D

---

## Author

**Yazmin** · [yazmin.dev](https://www.yazmin.dev/) · [github.com/yasi005](https://github.com/yasi005)

*Engineering elegance through code.*

---

**MIT licensed** — take it, remix it, leave a mark on the white.
