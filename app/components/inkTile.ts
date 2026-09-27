// One repeating tile of "starlight ink": the swatch colour with fine
// lithographic noise, risograph grit, cosmic dust and pinprick stars.
// Built at device resolution so a star is one crisp physical pixel.
export function inkTile(hex: string, dpr = 1, size = 256) {
  const n = Math.round(size * dpr);
  const px = Math.max(1, Math.round(dpr * 0.75));
  const tile = document.createElement("canvas");
  tile.width = tile.height = n;
  const g = tile.getContext("2d")!;
  g.fillStyle = hex;
  g.fillRect(0, 0, n, n);

  // Per-pixel noise wraps seamlessly by construction.
  const img = g.getImageData(0, 0, n, n);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() - 0.5) * 14 + (Math.random() < 0.005 ? 34 : 0);
    d[i] += v;
    d[i + 1] += v;
    d[i + 2] += v;
  }
  g.putImageData(img, 0, 0);

  const dot = (alpha: number, s = px) => {
    g.globalAlpha = alpha;
    g.fillRect(Math.floor(Math.random() * n), Math.floor(Math.random() * n), s, s);
  };
  g.fillStyle = "#c8ccd4";
  for (let i = 0; i < size * 1.2; i++) dot(0.08 + Math.random() * 0.14); // dust
  g.fillStyle = "#ffffff";
  for (let i = 0; i < size / 3.5; i++) dot(0.4 + Math.random() * 0.6); // pinpricks

  // A few twinkling crosshairs, kept off the edges so they never tile-clip.
  for (let i = 0; i < 3; i++) {
    const m = 10 * px;
    const x = Math.round(m + Math.random() * (n - 2 * m));
    const y = Math.round(m + Math.random() * (n - 2 * m));
    const arm = (3 + Math.round(Math.random() * 4)) * px;
    g.globalAlpha = 0.35;
    g.fillRect(x - arm, y, arm * 2 + px, px);
    g.fillRect(x, y - arm, px, arm * 2 + px);
    g.globalAlpha = 1;
    g.fillRect(x, y, px, px);
  }
  g.globalAlpha = 1;
  return tile;
}
