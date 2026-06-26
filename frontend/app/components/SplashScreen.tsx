import { useEffect, useState } from "react";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 2200);
    const t3 = setTimeout(() => onDone(), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #0d1f17 0%, #111f18 60%, #162b20 100%)",
        opacity: phase === "exit" ? 0 : 1,
        transition: phase === "exit" ? "opacity 0.5s ease" : "opacity 0.4s ease",
      }}
    >
      {/* Ambient glow rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full border border-teal-500/10"
          style={{
            width: 520, height: 520,
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "ping-slow 3s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full border border-teal-400/10"
          style={{
            width: 360, height: 360,
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "ping-slow 3s ease-in-out infinite 0.6s",
          }}
        />
        <div
          className="absolute rounded-full bg-teal-500/5"
          style={{
            width: 200, height: 200,
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Logo mark */}
      <div
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transform: phase === "enter" ? "scale(0.8) translateY(10px)" : "scale(1) translateY(0)",
          transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        className="relative flex flex-col items-center gap-6"
      >
        {/* Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center backdrop-blur-sm shadow-2xl">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="14" cy="14" r="5" fill="#5eead4" opacity="0.65" />
              <circle cx="26" cy="14" r="5" fill="#99f6e4" opacity="0.65" />
              <circle cx="20" cy="26" r="5" fill="#6ee7b7" opacity="0.65" />
              <line x1="14" y1="14" x2="26" y2="14" stroke="#3d6b58" strokeWidth="1.5" opacity="0.5" />
              <line x1="14" y1="14" x2="20" y2="26" stroke="#3d6b58" strokeWidth="1.5" opacity="0.5" />
              <line x1="26" y1="14" x2="20" y2="26" stroke="#3d6b58" strokeWidth="1.5" opacity="0.5" />
            </svg>
          </div>
          {/* Sparkle dots */}
          {[
            { top: -8, right: -8, delay: "0.8s", size: 4, color: "#5eead4" },
            { bottom: -6, left: -10, delay: "1.1s", size: 3, color: "#99f6e4" },
            { top: 4, left: -14, delay: "1.4s", size: 3, color: "#6ee7b7" },
          ].map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: s.size, height: s.size,
                background: s.color,
                top: s.top, right: s.right,
                bottom: s.bottom, left: s.left,
                animation: `sparkle 2s ease-in-out infinite ${s.delay}`,
              }}
            />
          ))}
        </div>

        {/* Wordmark */}
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold tracking-tight"
            style={{ color: "#f0f4f1", letterSpacing: "-0.02em" }}>
            Study<span style={{ color: "#6ee7b7" }}>Circle</span>
          </h1>
          <p
            className="text-sm font-sans mt-2 tracking-widest uppercase"
            style={{
              color: "#4b7c68",
              opacity: phase === "hold" || phase === "exit" ? 1 : 0,
              transform: phase === "hold" || phase === "exit" ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 0.4s ease 0.3s, transform 0.4s ease 0.3s",
            }}
          >
            Learn · Connect · Grow
          </p>
        </div>
      </div>

      {/* Loading bar */}
      <div
        className="absolute bottom-12 w-32 h-0.5 rounded-full overflow-hidden"
        style={{ background: "rgba(116,198,157,0.2)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #5eead4, #6ee7b7)",
            width: phase === "enter" ? "0%" : phase === "hold" ? "80%" : "100%",
            transition: phase === "enter"
              ? "width 0.6s ease"
              : phase === "hold"
              ? "width 1.4s ease"
              : "width 0.4s ease",
          }}
        />
      </div>

      <style>{`
        @keyframes ping-slow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.1; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
