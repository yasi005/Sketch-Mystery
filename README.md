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
| **Hello demo** | A cursive intro writes itself on load, then dissolves |
| **Calibration dock** | Eight deep, desaturated inks — abyssal through monolith zinc |
| **Keys `1`–`8`** | Jump straight to a swatch |
| **`C` / `D`** | Clear the field · replay the hello |
| **Telemetry** | Live `X / Y` and `REVEALED %` in the corner |

Respects `prefers-reduced-motion` — the intro stays quiet when asked.

---

## How the reveal works

Nothing is masked. Nothing is cheated with a clip path.

1. A canvas paints matte ink under your pointer  
2. A white overlay — editorial type + SVG orbital wireframes — sits on top  
3. On white ground the overlay disappears; on dark ink it reads razor-sharp  
4. A coarse coverage grid samples painted cells to drive **REVEALED %**

The brush itself is a circle stamp with grain around the rim. Width ramps with stroke
distance (and real stylus pressure when you have it). Roughness grows as the mark widens —
smooth lead-in, rugged body.

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
│   ├── BrushCanvas.tsx   # ink, dock, telemetry, pointer input
│   └── HelloDemo.tsx     # cursive hello — draw, glint, dissolve
├── globals.css
├── layout.tsx
└── page.tsx
```

One screen. One job. The hello lives in its own component so the intro timeline
never tangles with free drawing.

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
