// components/ScoreBoard.jsx
// Tracks wins and move counts across both rounds.

export default function ScoreBoard({ scores, humanRole, round }) {
  const { round1Winner, round1Moves, round2Winner, round2Moves, overallWinner } = scores || {};

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-800 pb-2">
        Scoreboard
      </h3>

      <div className="flex gap-3">
        {/* Round 1 */}
        <RoundCard
          label="Round 1"
          winner={round1Winner}
          moves={round1Moves}
          isCurrent={round === 1}
        />
        {/* Round 2 */}
        <RoundCard
          label="Round 2"
          winner={round2Winner}
          moves={round2Moves}
          isCurrent={round === 2}
        />
      </div>

      {/* Overall winner banner */}
      {overallWinner && (
        <div className={`
          mt-3 rounded-xl p-3 text-center font-bold text-sm uppercase tracking-widest
          ${overallWinner === 'human'
            ? 'bg-violet-900/40 text-violet-300 border border-violet-500/40'
            : overallWinner === 'ai'
              ? 'bg-red-900/30 text-red-300 border border-red-500/40'
              : 'bg-gray-800/50 text-gray-300 border border-gray-600/40'
          }
        `}>
          {overallWinner === 'draw' ? '🤝 Draw!' :
           overallWinner === 'human' ? '🏆 You Win Overall!' :
           '🤖 AI Wins Overall!'}
        </div>
      )}

      {/* Role indicator */}
      <div className="mt-3 flex justify-between text-xs text-gray-500">
        <span>
          Your role:{' '}
          <span className={`font-semibold ${humanRole === 'seeker' ? 'text-violet-400' : 'text-amber-400'}`}>
            {humanRole === 'seeker' ? '🎯 Goal Seeker' : '🛡 Opponent'}
          </span>
        </span>
        <span className="text-gray-600 font-mono">Round {round}/2</span>
      </div>
    </div>
  );
}

function RoundCard({ label, winner, moves, isCurrent }) {
  return (
    <div className={`
      flex-1 rounded-xl p-3 text-center border transition-all duration-300
      ${isCurrent
        ? 'bg-violet-900/20 border-violet-600/40'
        : 'bg-gray-900/30 border-gray-700/30'
      }
    `}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      {winner ? (
        <>
          <p className={`text-lg font-bold ${winner === 'human' ? 'text-violet-300' : 'text-emerald-300'}`}>
            {winner === 'human' ? '👤 You' : '🤖 AI'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{moves} moves</p>
        </>
      ) : (
        <p className="text-2xl mt-1 text-gray-700">—</p>
      )}
    </div>
  );
}
