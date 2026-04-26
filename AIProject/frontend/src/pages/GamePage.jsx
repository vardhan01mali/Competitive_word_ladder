// pages/GamePage.jsx
// Main game screen orchestrating all components and API calls.

import { useState, useEffect, useCallback } from 'react';
import WordDisplay from '../components/WordDisplay';
import MoveInput from '../components/MoveInput';
import WordHistory from '../components/WordHistory';
import GameStatus from '../components/GameStatus';
import ScoreBoard from '../components/ScoreBoard';
import { api } from '../api/gameApi';

export default function GamePage({ initialState, onNewGame }) {
  const [gameState, setGameState] = useState(initialState);
  const [error, setError] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  const { currentWord, goalWord, bannedPosition, currentTurn, aiRole, humanRole,
          status, message, history, scores, round } = gameState;

  // ── Auto-trigger AI move when it's AI's turn ──────────────────────────────
  const triggerAiMove = useCallback(async () => {
    if (gameState.status !== 'playing' || gameState.currentTurn !== 'ai') return;

    setIsAiThinking(true);
    setError('');

    // Brief delay for UX — makes AI feel like it's "thinking"
    await new Promise(r => setTimeout(r, 700 + Math.random() * 600));

    try {
      const data = await api.aiMove();
      setGameState(data.state);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsAiThinking(false);
    }
  }, [gameState.status, gameState.currentTurn]);

  useEffect(() => {
    if (gameState.currentTurn === 'ai' && gameState.status === 'playing' && !isAiThinking) {
      triggerAiMove();
    }
  }, [gameState.currentTurn, gameState.status, triggerAiMove, isAiThinking]);

  // ── Human move ────────────────────────────────────────────────────────────
  async function handleHumanMove(word) {
    setError('');
    try {
      const data = await api.makeMove(word);
      setGameState(data.state);
    } catch (e) {
      setError(e.message);
    }
  }

  // ── Advance to round 2 ────────────────────────────────────────────────────
  async function handleNextRound() {
    setError('');
    try {
      const data = await api.nextRound();
      setGameState(data.state);
    } catch (e) {
      setError(e.message);
    }
  }

  const isHumanTurn = currentTurn === 'human' && status === 'playing' && !isAiThinking;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-6 py-4 glass border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black gradient-text tracking-tight">WORD DUEL</span>
          <span className="px-2 py-0.5 text-xs bg-violet-900/50 text-violet-300 rounded-full font-mono border border-violet-700/40">
            Round {round}/2
          </span>
        </div>
        <button
          onClick={onNewGame}
          className="text-xs font-semibold text-gray-500 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-gray-800/60"
        >
          ↩ New Game
        </button>
      </header>

      {/* ── Main layout ── */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">

        {/* ── Left column: game board ── */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Status */}
          <GameStatus
            status={status}
            message={message}
            error={error}
            currentTurn={currentTurn}
            humanRole={humanRole}
            isAiThinking={isAiThinking}
          />

          {/* Current word display */}
          <div className="glass-strong rounded-3xl p-8 flex flex-col items-center gap-6">
            <WordDisplay
              word={currentWord}
              bannedPosition={bannedPosition}
              goalWord={goalWord}
            />

            {/* Goal indicator */}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">Transform to:</span>
              <div className="flex gap-2">
                {goalWord?.split('').map((l, i) => (
                  <span
                    key={i}
                    className={`
                      w-10 h-10 flex items-center justify-center font-mono font-bold text-xl rounded-lg uppercase
                      ${currentWord?.[i] === l
                        ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/40'
                        : 'bg-gray-800/50 text-gray-400 border border-gray-700/40'
                      }
                    `}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <HammingProgress currentWord={currentWord} goalWord={goalWord} />
          </div>

          {/* Move input (only shown on human's turn) */}
          {isHumanTurn && (
            <div className="glass rounded-2xl p-6 animate-slide-up">
              <MoveInput
                onSubmit={handleHumanMove}
                disabled={!isHumanTurn}
                currentWord={currentWord}
                bannedPosition={bannedPosition}
              />
            </div>
          )}

          {/* AI thinking card */}
          {isAiThinking && (
            <div className="glass rounded-2xl p-6 flex items-center justify-center gap-4 animate-slide-up">
              <div className="w-10 h-10 rounded-full bg-emerald-900/40 border border-emerald-500/40 flex items-center justify-center text-xl animate-float">
                🤖
              </div>
              <div>
                <p className="font-semibold text-emerald-300">AI is computing…</p>
                <p className="text-xs text-gray-500">
                  {aiRole === 'seeker' ? 'Searching for the goal' : 'Plotting to trap you'}
                </p>
              </div>
            </div>
          )}

          {/* Round-over actions */}
          {status === 'round_over' && (
            <div className="glass-strong rounded-2xl p-6 flex flex-col items-center gap-4 animate-bounce-in">
              <p className="text-lg font-bold text-white text-center">{message}</p>
              <button
                onClick={handleNextRound}
                className="
                  px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm
                  bg-gradient-to-r from-emerald-600 to-teal-600
                  hover:from-emerald-500 hover:to-teal-500
                  transition-all duration-200 hover:scale-105 active:scale-95
                  shadow-lg shadow-emerald-900/40
                "
              >
                Start Round 2 →
              </button>
            </div>
          )}

          {/* Game over actions */}
          {status === 'game_over' && (
            <div className="glass-strong rounded-2xl p-6 flex flex-col items-center gap-4 animate-bounce-in">
              <p className="text-xl font-black gradient-text text-center">{message}</p>
              <button
                onClick={onNewGame}
                className="
                  px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm
                  bg-gradient-to-r from-violet-600 to-purple-600
                  hover:from-violet-500 hover:to-purple-500
                  transition-all duration-200 hover:scale-105 active:scale-95
                "
              >
                ⚔ Play Again
              </button>
            </div>
          )}
        </div>

        {/* ── Right column: history + scoreboard ── */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          <ScoreBoard scores={scores} humanRole={humanRole} round={round} />
          <div className="flex-1 min-h-60">
            <WordHistory history={history} goalWord={goalWord} />
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Hamming progress component ──────────────────────────────────────────────
function HammingProgress({ currentWord, goalWord }) {
  if (!currentWord || !goalWord) return null;

  let matching = 0;
  for (let i = 0; i < 4; i++) {
    if (currentWord[i] === goalWord[i]) matching++;
  }
  const pct = (matching / 4) * 100;

  return (
    <div className="w-full max-w-xs">
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>Progress to goal</span>
        <span className="font-mono text-violet-300">{matching}/4 letters match</span>
      </div>
      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
