# Brushiing

Ink-reveal canvas: draw with a textured brush to uncover typography and orbital wireframes on a white field.

## Stack

- Next.js (App Router)
- React
- Tailwind CSS
- Canvas 2D brush (client-only — no backend, no API keys)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Key | Action |
| --- | --- |
| Drag | Paint |
| `C` | Clear |
| `D` | Replay hello demo |
| `1`–`8` | Ink swatch |

## Environment

No secrets are required. See [`.env.example`](.env.example). If you add server config later, use `.env.local` and keep it out of git.

## Scripts

```bash
npm run dev    # development
npm run build  # production build
npm run start  # serve production build
npm run lint   # eslint
```

## License

MIT — see [LICENSE](LICENSE).

## Security

See [SECURITY.md](SECURITY.md) for how to report vulnerabilities.
