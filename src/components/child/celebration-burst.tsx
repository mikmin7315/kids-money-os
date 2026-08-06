'use client';

import { useEffect, useState } from 'react';

const PARTICLES = [
  { emoji: '⭐', left: '8%', delay: 0, dur: 1.1, size: 24 },
  { emoji: '🌟', left: '18%', delay: 0.08, dur: 1.3, size: 20 },
  { emoji: '✨', left: '28%', delay: 0.16, dur: 1.0, size: 18 },
  { emoji: '💫', left: '38%', delay: 0.06, dur: 1.2, size: 22 },
  { emoji: '🎉', left: '50%', delay: 0.12, dur: 1.4, size: 26 },
  { emoji: '⭐', left: '62%', delay: 0.04, dur: 1.1, size: 20 },
  { emoji: '✨', left: '72%', delay: 0.18, dur: 1.3, size: 18 },
  { emoji: '🌟', left: '82%', delay: 0.10, dur: 1.0, size: 24 },
  { emoji: '💫', left: '92%', delay: 0.14, dur: 1.2, size: 20 },
  { emoji: '🎊', left: '14%', delay: 0.22, dur: 1.5, size: 22 },
  { emoji: '⭐', left: '44%', delay: 0.20, dur: 1.1, size: 18 },
  { emoji: '🌟', left: '56%', delay: 0.26, dur: 1.3, size: 26 },
];

export function CelebrationBurst({ active }: { active: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      const t = setTimeout(() => setShow(true), 50);
      return () => clearTimeout(t);
    }
  }, [active]);

  if (!active || !show) return null;

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60, overflow: 'hidden' }}
    >
      <style>{`
        @keyframes cel-float {
          0%   { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          70%  { opacity: 0.9; }
          100% { opacity: 0; transform: translateY(-75vh) rotate(400deg) scale(0.3); }
        }
        @keyframes cel-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(167,139,250,0.5); }
          50% { box-shadow: 0 0 0 16px rgba(167,139,250,0); }
        }
        .cel-particle {
          position: absolute;
          bottom: 15%;
          will-change: transform, opacity;
          animation: cel-float var(--dur) ease-out both;
          animation-delay: var(--del);
        }
      `}</style>
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="cel-particle"
          style={{
            left: p.left,
            fontSize: p.size,
            '--dur': `${p.dur}s`,
            '--del': `${p.delay}s`,
          } as React.CSSProperties}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
