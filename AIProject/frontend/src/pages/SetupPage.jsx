// pages/SetupPage.jsx
// Setup screen: enter start & goal words, see sample paths, then start the game.

import { useState } from 'react';
import { api } from '../api/gameApi';

const SAMPLES = [
  { start: 'cold', goal: 'warm', path: 'COLD → CORD → WORD → WARD → WARM' },
  { start: 'head', goal: 'tail', path: 'HEAD → HEAL → TEAL → TELL → TALL → TAIL' },
  { start: 'lead', goal: 'gold', path: 'LEAD → LOAD → ROAD → RODE → CODE → COLD → GOLD' },
  { start: 'love', goal: 'hate', path: 'LOVE → LIVE → LIME → TIME → TIDE → HIDE → HIDE → LATE → HATE' },
];

export default function SetupPage({ onStart }) {
  const [startWord, setStartWord] = useState('');
  const [goalWord, setGoalWord] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function pickSample(s) {
    setStartWord(s.start);
    setGoalWord(s.goal);
    setError('');
  }

  async function handleStart() {
    if (startWord.length !== 4 || goalWord.length !== 4) {
      setError('Both words must be exactly 4 letters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.startGame(startWord.toLowerCase(), goalWord.toLowerCase());
      onStart(data.state);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Hero heading */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-900/30 border border-violet-700/40 text-xs font-semibold text-violet-300 uppercase tracking-widest mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Adversarial Word Game
        </div>
        <h1 className="text-6xl font-black gradient-text mb-4 leading-tight">
          WORD<br />DUEL
        </h1>
        <p className="text-gray-400 text-lg max-w-md">
          Transform words one letter at a time. Outsmart the AI in a two-round
          adversarial battle of wits.
        </p>
      </div>

      {/* Setup card */}
      <div className="glass-strong rounded-3xl p-8 w-full max-w-md flex flex-col gap-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">
          New Game Setup
        </h2>

        {/* Inputs */}
        <div className="flex gap-4">
          <WordInputBox
            label="Start Word"
            value={startWord}
            onChange={v => { setStartWord(v); setError(''); }}
            placeholder="e.g. cold"
            icon="🟣"
          />
          <div className="flex items-end pb-3 text-gray-600 text-xl">→</div>
          <WordInputBox
            label="Goal Word"
            value={goalWord}
            onChange={v => { setGoalWord(v); setError(''); }}
            placeholder="e.g. warm"
            icon="🟢"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 animate-slide-up text-center">⚠ {error}</p>
        )}

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={loading || startWord.length !== 4 || goalWord.length !== 4}
          className="
            w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-base
            bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600
            hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
            shadow-2xl shadow-violet-900/50
          "
        >
          {loading ? 'Starting…' : '⚔ Start Duel'}
        </button>

        {/* Sample paths */}
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold mb-3">
            Quick Start Examples
          </p>
          <div className="flex flex-col gap-2">
            {SAMPLES.map((s, i) => (
              <button
                key={i}
                onClick={() => pickSample(s)}
                className="
                  flex items-center justify-between px-4 py-2.5 rounded-xl
                  bg-gray-900/60 border border-gray-800/60 hover:border-violet-700/50
                  hover:bg-violet-900/10 text-left transition-all duration-200
                  group
                "
              >
                <div>
                  <span className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                    {s.start} → {s.goal}
                  </span>
                  <p className="text-xs text-gray-600 mt-0.5 font-mono">{s.path}</p>
                </div>
                <span className="text-gray-600 group-hover:text-violet-400 transition-colors text-lg">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="mt-8 glass rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Rules</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          {[
            '🔡 Change exactly one letter per move',
            '📖 Must always be a valid English word',
            '🔁 No word can be reused',
            '🚫 Cannot change the same position moved last turn',
            '🎯 Round 1: You seek the goal, AI opposes',
            '🔄 Round 2: Roles reverse',
            '🏆 Best of 2 rounds wins — fewer moves wins ties',
          ].map((rule, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function WordInputBox({ label, value, onChange, placeholder, icon }) {
  return (
    <div className="flex-1 flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
        <span>{icon}</span> {label}
      </label>
      <input
        type="text"
        maxLength={4}
        value={value.toUpperCase()}
        onChange={e => onChange(e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase())}
        placeholder={placeholder.toUpperCase()}
        className="
          w-full px-4 py-3 rounded-xl bg-gray-900 border-2 border-gray-700
          text-white font-mono font-bold text-xl uppercase text-center
          focus:outline-none focus:border-violet-500 transition-colors duration-200
          placeholder-gray-700
        "
      />
    </div>
  );
}
