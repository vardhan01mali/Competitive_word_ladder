// components/GameStatus.jsx
// Displays turn indicator, error flash, and winner banners.

export default function GameStatus({ status, message, error, currentTurn, humanRole, isAiThinking }) {
  const isTurnHuman = currentTurn === 'human';

  return (
    <div className="flex flex-col gap-2">
      {/* Turn indicator */}
      {status === 'playing' && (
        <div className={`
          flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500
          ${isTurnHuman && !isAiThinking
            ? 'bg-violet-900/20 border-violet-600/40 animate-glow'
            : 'bg-emerald-900/15 border-emerald-700/30'
          }
        `}>
          <span className="text-xl">
            {isAiThinking ? '🔄' : isTurnHuman ? '👤' : '🤖'}
          </span>
          <div>
            <p className="text-sm font-semibold text-white">
              {isAiThinking
                ? 'AI is thinking…'
                : isTurnHuman
                  ? 'Your Turn'
                  : "AI's Turn"
              }
            </p>
            <p className="text-xs text-gray-400">
              {isTurnHuman
                ? `You are the ${humanRole === 'seeker' ? '🎯 Goal Seeker' : '🛡 Opponent'}`
                : `AI is the ${humanRole === 'seeker' ? '🛡 Opponent' : '🎯 Goal Seeker'}`
              }
            </p>
          </div>

          {isAiThinking && (
            <div className="ml-auto flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-emerald-400"
                  style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Round-over / game-over banner */}
      {(status === 'round_over' || status === 'game_over') && (
        <div className={`
          px-4 py-4 rounded-xl border text-center animate-bounce-in
          ${status === 'game_over'
            ? 'bg-gradient-to-r from-violet-900/40 via-purple-900/40 to-violet-900/40 border-violet-500/50'
            : 'bg-amber-900/20 border-amber-600/40'
          }
        `}>
          <p className="text-lg font-bold text-white">{message}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 rounded-xl bg-red-950/50 border border-red-700/40 text-red-300 text-sm animate-slide-up">
          ⚠ {error}
        </div>
      )}

      {/* Status message during play */}
      {status === 'playing' && message && (
        <p className="text-xs text-gray-500 text-center px-2">{message}</p>
      )}
    </div>
  );
}
