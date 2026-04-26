// components/WordDisplay.jsx
// Shows the current word as 4 individual letter tiles.
// The banned position is highlighted in amber; the rest have a purple glow.

import { useEffect, useState } from 'react';

export default function WordDisplay({ word, bannedPosition, goalWord }) {
  const [animate, setAnimate] = useState(false);

  // Trigger bounce animation whenever the word changes
  useEffect(() => {
    setAnimate(true);
    const t = setTimeout(() => setAnimate(false), 500);
    return () => clearTimeout(t);
  }, [word]);

  if (!word) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Label */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Current Word
        </span>
        {goalWord && (
          <span className="text-xs text-gray-500">
            → Goal:
            <span className="ml-1 font-mono font-bold text-emerald-400 uppercase">
              {goalWord}
            </span>
          </span>
        )}
      </div>

      {/* Letter tiles */}
      <div className={`flex gap-3 ${animate ? 'animate-bounce-in' : ''}`}>
        {word.split('').map((letter, i) => {
          const isBanned = bannedPosition !== null && bannedPosition === i;
          const isMatch = goalWord && letter === goalWord[i];

          return (
            <div
              key={i}
              className={`
                letter-box text-4xl uppercase select-none
                ${isBanned
                  ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 neon-border-red shadow-amber-500/30'
                  : isMatch
                    ? 'bg-emerald-500/15 border-2 border-emerald-400 text-emerald-300 neon-border-green'
                    : 'bg-violet-900/30 border-2 border-violet-500/60 text-violet-100 neon-border'
                }
              `}
              title={isBanned ? `Position ${i + 1}: BANNED this turn` : `Position ${i + 1}`}
            >
              {letter}
            </div>
          );
        })}
      </div>

      {/* Position index helper */}
      <div className="flex gap-3">
        {word.split('').map((_, i) => (
          <div key={i} className="w-16 text-center">
            {bannedPosition === i ? (
              <span className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
                <span>🚫</span>
                <span>P{i + 1}</span>
              </span>
            ) : (
              <span className="text-xs text-gray-600 font-mono">P{i + 1}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
