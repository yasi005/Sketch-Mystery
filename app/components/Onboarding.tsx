"use client";

type SplashProps = {
  visible: boolean;
};

/** Full-viewport welcome: Hello → Welcome to Brushiing */
export function WelcomeSplash({ visible }: SplashProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700 ease-out ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{ backgroundColor: "#EFE9DD" }}
      aria-hidden={!visible}
      aria-busy={visible}
    >
      <div
        className={`flex flex-col items-center gap-3 text-center transition-all duration-700 ${
          visible ? "translate-y-0 scale-100" : "translate-y-3 scale-[0.98]"
        }`}
      >
        <p className="font-sans text-[clamp(3rem,12vw,6.5rem)] font-bold leading-none tracking-[-0.07em] text-zinc-900">
          Hello
        </p>
        <p className="font-mono text-[11px] tracking-[0.32em] text-zinc-600 uppercase">
          Welcome to Brushiing
        </p>
        <span
          className="mt-8 h-px w-16 origin-center bg-zinc-900/25 motion-safe:animate-pulse"
          aria-hidden
        />
      </div>
    </div>
  );
}

type HintProps = {
  visible: boolean;
  onDismiss: () => void;
};

/** Attractive popup that explains the reversible page and invites drawing. */
export function DrawHint({ visible, onDismiss }: HintProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-[58%] z-40 flex justify-center px-4 transition-all duration-700 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
      role="dialog"
      aria-label="How to draw"
      aria-hidden={!visible}
    >
      <div
        className={`w-full max-w-[340px] rounded-sm border border-zinc-900/12 bg-[#EFE9DD]/92 px-5 py-4 shadow-[0_16px_48px_rgba(42,29,20,0.12)] backdrop-blur-md ${
          visible ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div className="mb-3 flex items-center gap-2.5">
          <span className="relative block h-3.5 w-3.5 shrink-0" aria-hidden>
            <span className="absolute inset-0 rounded-full border border-[#C8643B] motion-safe:animate-ping" />
            <span className="absolute inset-[4px] rounded-full bg-[#C8643B]" />
          </span>
          <p className="font-sans text-[15px] font-bold tracking-[-0.03em] text-zinc-900">
            Drag to turn the page
          </p>
        </div>
        <p className="font-mono text-[10px] leading-relaxed tracking-[0.04em] text-zinc-600">
          This is a reversible atlas. Paint anywhere and Side A flips into the night chart —
          typography and orbits only appear where your ink lands.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 w-full rounded-sm bg-zinc-900 px-3 py-2.5 font-mono text-[10px] tracking-[0.2em] text-[#EFE9DD] uppercase transition-colors hover:bg-zinc-800"
        >
          Start drawing
        </button>
        <p className="mt-2.5 text-center font-mono text-[9px] tracking-wide text-zinc-400">
          or just drag · C clear · D peek
        </p>
      </div>
    </div>
  );
}
