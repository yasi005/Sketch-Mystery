"use client";

import { useEffect, useState } from "react";

export type DockSwatch = {
  id: string;
  name: string;
  hex: string;
  nm: string;
};

type Props = {
  swatches: DockSwatch[];
  activeId: string;
  onSelect: (id: string) => void;
  onClear: () => void;
  onPeek: () => void;
  accent?: string;
};

/** Atlas pigment strip — open caption layout, square samples, loud Clear/Peek. */
export default function CalibrationDock({
  swatches,
  activeId,
  onSelect,
  onClear,
  onPeek,
  accent = "#C8643B",
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const active = swatches.find((s) => s.id === activeId) ?? swatches[0];

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-30 flex h-11 items-center border border-[#2A1D14]/20 bg-[#EFE9DD]/90 px-3.5 font-mono text-[12px] font-medium tracking-[0.2em] text-[#2A1D14] uppercase touch-manipulation md:hidden"
        aria-expanded={menuOpen}
        aria-controls="mobile-tools"
      >
        {menuOpen ? "Close" : "Menu"}
      </button>

      <div
        id="mobile-tools"
        className={`absolute top-[max(3.75rem,calc(env(safe-area-inset-top)+2.75rem))] right-[max(1rem,env(safe-area-inset-right))] z-30 w-[min(78vw,260px)] border border-[#2A1D14]/15 bg-[#EFE9DD] p-3 transition-all duration-200 md:hidden ${
          menuOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
        }`}
        aria-hidden={!menuOpen}
      >
        <p className="mb-2 font-mono text-[11px] tracking-[0.18em] text-[#2A1D14]/55 uppercase">
          Tools
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onClear();
              setMenuOpen(false);
            }}
            className="min-h-12 border border-[#2A1D14]/25 bg-white/50 px-3 text-left font-sans text-[15px] font-semibold tracking-wide text-[#2A1D14] touch-manipulation"
          >
            Clear page
          </button>
          <button
            type="button"
            onClick={() => {
              onPeek();
              setMenuOpen(false);
            }}
            className="min-h-12 border px-3 text-left font-sans text-[15px] font-semibold tracking-wide text-[#2A1D14] touch-manipulation"
            style={{ borderColor: `${accent}88`, backgroundColor: `${accent}22` }}
          >
            Peek demo
          </button>
        </div>
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-[#2A1D14]/70">
          <span className="font-semibold" style={{ color: accent }}>
            {active.name}
          </span>
          <br />
          {active.hex} · {active.nm}
        </p>
      </div>

      <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-20 w-[min(96vw,520px)] -translate-x-1/2 px-2 sm:bottom-[max(1.25rem,env(safe-area-inset-bottom))] md:bottom-[max(1.75rem,env(safe-area-inset-bottom))]">
        {/* Open caption — no frosted card */}
        <div className="border-t border-[#2A1D14]/25 pt-3">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-[0.22em] text-[#2A1D14]/45 uppercase sm:text-[11px]">
                Pigment
              </p>
              <p className="truncate font-sans text-[clamp(1.1rem,4vw,1.45rem)] font-bold leading-tight tracking-[-0.03em] text-[#2A1D14]">
                {active.name}
              </p>
              <p className="mt-0.5 font-mono text-[11px] tracking-wide text-[#2A1D14]/55 tabular-nums">
                {active.hex}
                <span className="mx-1.5 opacity-40">·</span>
                {active.nm}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={onClear}
                className="min-h-12 min-w-[5.5rem] border border-[#2A1D14]/30 bg-[#EFE9DD]/90 px-3 font-sans text-[13px] font-bold tracking-wide text-[#2A1D14] uppercase touch-manipulation sm:min-w-[6.5rem] sm:text-[14px]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={onPeek}
                className="min-h-12 min-w-[5.5rem] border px-3 font-sans text-[13px] font-bold tracking-wide text-[#2A1D14] uppercase touch-manipulation sm:min-w-[6.5rem] sm:text-[14px]"
                style={{
                  borderColor: accent,
                  backgroundColor: accent,
                  color: "#EFE9DD",
                }}
              >
                Peek
              </button>
            </div>
          </div>

          {/* Square pigment chips — the whole tray reads as color */}
          <div className="grid grid-cols-8 gap-1 sm:gap-1.5">
            {swatches.map((swatch, i) => {
              const selected = swatch.id === activeId;
              return (
                <button
                  key={swatch.id}
                  type="button"
                  onClick={() => onSelect(swatch.id)}
                  className="group flex flex-col gap-1 outline-none touch-manipulation"
                  aria-label={`${swatch.name} ${swatch.hex}`}
                  aria-pressed={selected}
                >
                  <span
                    className={`block aspect-square w-full border transition-[transform,box-shadow] duration-150 ${
                      selected
                        ? "scale-[1.04] border-[#2A1D14]"
                        : "border-[#2A1D14]/15 group-hover:border-[#2A1D14]/40"
                    }`}
                    style={{
                      backgroundColor: swatch.hex,
                      boxShadow: selected ? `0 0 0 2px ${accent}` : undefined,
                    }}
                  />
                  <span
                    className={`text-center font-mono text-[8px] leading-none tracking-wide sm:text-[9px] ${
                      selected ? "font-semibold text-[#2A1D14]" : "text-[#2A1D14]/55"
                    }`}
                  >
                    <span className="sm:hidden">{String(i + 1)}</span>
                    <span className="hidden truncate sm:block">{swatch.name.slice(0, 4)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-2 text-center font-mono text-[11px] tracking-[0.14em] text-[#2A1D14]/50 uppercase sm:text-[12px]">
          Drag to paint
        </p>
      </div>
    </>
  );
}
