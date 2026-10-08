"use client";

import { useEffect, useState } from "react";

const HELLO = "Hello";
const WELCOME = "Welcome to Brushiing";

type SplashProps = {
  visible: boolean;
};

/** Full-viewport welcome with typed Hello → Welcome to Brushiing. */
export function WelcomeSplash({ visible }: SplashProps) {
  const [hello, setHello] = useState("");
  const [welcome, setWelcome] = useState("");
  const [phase, setPhase] = useState<"hello" | "welcome" | "hold">("hello");
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setExiting(true);
      return;
    }
    setExiting(false);
    setHello("");
    setWelcome("");
    setPhase("hello");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setHello(HELLO);
      setWelcome(WELCOME);
      setPhase("hold");
      return;
    }

    let i = 0;
    let j = 0;
    let helloTimer = 0;
    let welcomeTimer = 0;
    let gapTimer = 0;

    helloTimer = window.setInterval(() => {
      i += 1;
      setHello(HELLO.slice(0, i));
      if (i >= HELLO.length) {
        window.clearInterval(helloTimer);
        gapTimer = window.setTimeout(() => {
          setPhase("welcome");
          welcomeTimer = window.setInterval(() => {
            j += 1;
            setWelcome(WELCOME.slice(0, j));
            if (j >= WELCOME.length) {
              window.clearInterval(welcomeTimer);
              setPhase("hold");
            }
          }, 42);
        }, 280);
      }
    }, 90);

    return () => {
      window.clearInterval(helloTimer);
      window.clearInterval(welcomeTimer);
      window.clearTimeout(gapTimer);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) setExiting(true);
  }, [visible]);

  const show = visible || exiting;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ease-out ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{ backgroundColor: "#EFE9DD" }}
      aria-hidden={!show}
      aria-busy={visible}
      onTransitionEnd={() => {
        if (!visible) setExiting(false);
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 45%, rgba(200,100,59,0.14), transparent 70%)",
        }}
        aria-hidden
      />

      <div
        className={`relative flex flex-col items-center gap-4 px-6 text-center transition-all duration-700 ${
          visible ? "translate-y-0 scale-100" : "translate-y-4 scale-[0.97]"
        }`}
      >
        <p
          className={`font-sans text-[clamp(3rem,12vw,6.5rem)] font-bold leading-none tracking-[-0.07em] text-zinc-900 motion-safe:animate-[splash-rise_0.7s_ease-out] ${
            phase !== "hello" ? "opacity-100" : "opacity-100"
          }`}
        >
          {hello}
          {phase === "hello" && (
            <span className="ml-1 inline-block h-[0.85em] w-[0.08em] translate-y-[0.06em] bg-zinc-900 align-middle motion-safe:animate-[caret-blink_0.9s_steps(1)_infinite]" />
          )}
        </p>

        <p className="min-h-[1.25rem] font-mono text-[clamp(10px,2.4vw,13px)] tracking-[0.28em] text-zinc-600 uppercase">
          {welcome}
          {phase === "welcome" && (
            <span className="ml-1 inline-block h-[0.9em] w-[0.45em] translate-y-[0.05em] bg-[#C8643B]/80 align-middle motion-safe:animate-[caret-blink_0.9s_steps(1)_infinite]" />
          )}
        </p>

        <span
          className={`mt-6 h-px bg-zinc-900/30 transition-all duration-700 ease-out ${
            phase === "hold" ? "w-20 opacity-100" : "w-0 opacity-0"
          }`}
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

/** Full-screen blurred overlay; auto-fades after 3s, or close via ×. */
export function DrawHint({ visible, onDismiss }: HintProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShown(false);
      return;
    }
    // Enter on next frame so the fade-in runs.
    const enter = requestAnimationFrame(() => setShown(true));
    const auto = window.setTimeout(() => {
      setShown(false);
      window.setTimeout(onDismiss, 450);
    }, 3000);
    return () => {
      cancelAnimationFrame(enter);
      window.clearTimeout(auto);
    };
  }, [visible, onDismiss]);

  const close = () => {
    setShown(false);
    window.setTimeout(onDismiss, 450);
  };

  if (!visible && !shown) return null;

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center px-6 transition-opacity duration-500 ease-out ${
        shown ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="How to draw"
      aria-hidden={!shown}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-[#2A1D14]/35 backdrop-blur-md"
        aria-label="Dismiss hint"
        onClick={close}
      />

      <div
        className={`relative z-10 flex max-w-[28rem] flex-col items-center text-center transition-all duration-500 ease-out ${
          shown ? "translate-y-0 scale-100" : "translate-y-3 scale-[0.98]"
        }`}
      >
        <button
          type="button"
          onClick={close}
          className="absolute -top-10 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 font-mono text-lg leading-none text-white/90 backdrop-blur-sm transition-colors hover:bg-white/20"
          aria-label="Close"
        >
          ×
        </button>

        <span className="relative mb-5 block h-3.5 w-3.5" aria-hidden>
          <span className="absolute inset-0 rounded-full border border-[#C8643B] motion-safe:animate-ping" />
          <span className="absolute inset-[4px] rounded-full bg-[#C8643B]" />
        </span>

        <p className="font-sans text-[clamp(1.4rem,4vw,2rem)] font-bold tracking-[-0.04em] text-white">
          Drag to turn the page
        </p>
        <p className="mt-3 max-w-[22rem] font-mono text-[11px] leading-relaxed tracking-[0.06em] text-white/75">
          Paint anywhere — Side A flips into the night chart. Typography and orbits only appear
          where your ink lands.
        </p>
        <p className="mt-6 font-mono text-[9px] tracking-[0.22em] text-white/45 uppercase">
          closes in 3s · or tap ×
        </p>
      </div>
    </div>
  );
}
