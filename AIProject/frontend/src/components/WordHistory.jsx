// components/WordHistory.jsx
// Scrollable panel showing every move made, labelled by player & round.

import { useEffect, useRef } from 'react';

const PLAYER_CONFIG = {
  human: {
    icon: '👤',
    label: 'You',
    color: 'text-violet-300',
    bg: 'bg-violet-900/20',
    border: 'border-violet-700/40',
  },
  ai: {
    icon: '🤖',
    label: 'AI',
    color: 'text-emerald-300',
    bg: 'bg-emerald-900/20',
    border: 'border-emerald-700/40',
  },
  start: {
    icon: '🎮',
    label: 'Start',
    color: 'text-gray-400',
    bg: 'bg-gray-800/30',
    border: 'border-gray-700/30',
  },
};

export default function WordHistory({ history, goalWord }) {
  const bottomRef = useRef(null);

  // Auto-scroll to latest entry
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (!history || history.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-3 h-full">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-800 pb-2">
        Move History
      </h3>

      <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-2 pr-1">
        {history.map((entry, idx) => {
          const cfg = PLAYER_CONFIG[entry.player] || PLAYER_CONFIG.start;
          const isGoal = entry.word === goalWord;
          const roundBadge = entry.round ? `R${entry.round}` : '';

          return (
            <div
              key={idx}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl border
                ${cfg.bg} ${cfg.border}
                animate-slide-up
                ${isGoal ? 'ring-1 ring-emerald-400/60' : ''}
              `}
            >
              {/* Move number */}
              <span className="text-xs text-gray-600 font-mono w-5 shrink-0">
                {idx === 0 ? '—' : idx}
              </span>

              {/* Player icon */}
              <span className="text-base">{cfg.icon}</span>

              {/* Word */}
              <span className={`font-mono font-bold uppercase text-lg tracking-widest ${cfg.color} flex-1`}>
                {entry.word}
                {isGoal && <span className="ml-2 text-xs text-emerald-400">🏆 GOAL!</span>}
              </span>

              {/* Round badge */}
              {roundBadge && (
                <span className="text-xs bg-gray-800 text-gray-500 rounded-full px-2 py-0.5 font-mono">
                  {roundBadge}
                </span>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
