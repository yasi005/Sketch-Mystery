# Brushiing

**Ink reveal for the web.** Paint a textured brush stroke across a white canvas and uncover Swiss editorial typography, orbital wireframes, and live telemetry — camouflaged until the pigment lands.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE)

---

## Features

- **Textured circle brush** — granular ink dabs with pressure-aware width (mouse, touch, or stylus)
- **Ink reveal** — white-on-white type & blueprints only appear where you paint
- **Hello demo** — cursive intro stroke on load (respects `prefers-reduced-motion`)
- **Calibration dock** — 8 curated deep ink swatches with telemetry labels
- **Live readouts** — pointer coordinates + revealed coverage %
- **Client-only** — no backend, no API keys, safe to fork and deploy

## Quick start

```bash
# clone
git clone https://github.com/<your-username>/brushiing.git
cd brushiing

# install
npm install

# develop
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Production build         |
| `npm run start` | Serve production build   |
| `npm run lint`  | Run ESLint               |

## Controls

| Input     | Action                |
| --------- | --------------------- |
| Drag      | Paint ink             |
| `C`       | Clear canvas          |
| `D`       | Replay hello demo     |
| `1` – `8` | Select ink swatch     |
| Click dock| Select ink visually   |

## How it works

1. A full-viewport canvas paints matte ink under your pointer  
2. A white overlay (type + SVG orbital wireframes) sits on top  
3. On pure white the overlay is invisible; on dark ink it reads clearly  
4. Coverage is sampled on a coarse grid to drive **REVEALED %**

```
┌─────────────────────────────────────┐
│  Header · EXPLORE THE SPACE         │
│                                     │
│     [ white typography / orbits ]   │  ← RevealLayer (white)
│     [        ink strokes        ]   │  ← <canvas>
│     [       pure white bg       ]   │
│                                     │
│          ▌ calibration dock ▐       │
│                    X/Y · REVEALED % │
└─────────────────────────────────────┘
```

## Project structure

```
app/
├── components/
│   ├── BrushCanvas.tsx   # canvas, dock, telemetry, input
│   └── HelloDemo.tsx     # cursive hello intro animation
├── globals.css
├── layout.tsx
└── page.tsx
```

## Tech stack

- **Next.js 16** — App Router
- **React 19** — client components for pointer + canvas
- **TypeScript**
- **Tailwind CSS 4**
- **Canvas 2D** — no WebGL, no extra brush libraries

## Environment

No secrets required. Optional template: [`.env.example`](./.env.example).

If you add server config later, keep real values in `.env.local` (gitignored).

## Contributing

Issues and PRs are welcome.

1. Fork the repo  
2. Create a branch (`git checkout -b feature/your-idea`)  
3. Commit your changes  
4. Open a pull request  

## Security

See [SECURITY.md](./SECURITY.md) for private vulnerability reporting.

## License

Released under the [MIT License](./LICENSE).
