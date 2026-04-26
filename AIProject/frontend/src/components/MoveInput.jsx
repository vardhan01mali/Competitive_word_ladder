// components/MoveInput.jsx
// 4 individual letter input boxes that auto-advance focus.
// Client-side validation before sending to backend.

import { useState, useRef, useEffect } from 'react';

export default function MoveInput({ onSubmit, disabled, currentWord, bannedPosition }) {
  const [letters, setLetters] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Reset on new word
  useEffect(() => {
    setLetters(['', '', '', '']);
    setError('');
    inputs[0].current?.focus();
  }, [currentWord]);

  function triggerShake(msg) {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 400);
  }

  function handleChange(i, val) {
    const ch = val.replace(/[^a-zA-Z]/g, '').slice(-1).toLowerCase();
    const next = [...letters];
    next[i] = ch;
    setLetters(next);
    setError('');

    if (ch && i < 3) {
      inputs[i + 1].current?.focus();
    }
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !letters[i] && i > 0) {
      inputs[i - 1].current?.focus();
    }
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }

  function handleSubmit() {
    const word = letters.join('');
    if (word.length !== 4) {
      triggerShake('Enter all 4 letters.');
      return;
    }

    // Client-side: count letter differences
    let diffCount = 0;
    let diffPos = -1;
    for (let i = 0; i < 4; i++) {
      if (word[i] !== currentWord[i]) {
        diffCount++;
        diffPos = i;
      }
    }

    if (diffCount === 0) {
      triggerShake('That is the same word!');
      return;
    }
    if (diffCount > 1) {
      triggerShake('Only one letter can change per move.');
      return;
    }
    if (bannedPosition !== null && diffPos === bannedPosition) {
      triggerShake(`Position ${bannedPosition + 1} is banned this turn! 🚫`);
      return;
    }

    onSubmit(word);
    setLetters(['', '', '', '']);
    inputs[0].current?.focus();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        Your Move
      </span>

      {/* 4-box input */}
      <div className={`flex gap-3 ${shake ? 'animate-shake' : ''}`}>
        {letters.map((letter, i) => {
          const isBanned = bannedPosition !== null && i === bannedPosition;
          return (
            <input
              key={i}
              ref={inputs[i]}
              type="text"
              maxLength={2}
              value={letter.toUpperCase()}
              disabled={disabled}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`
                w-16 h-16 text-center text-2xl font-bold font-mono uppercase rounded-xl
                bg-gray-900 border-2 outline-none transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
                focus:scale-105
                ${isBanned
                  ? 'border-amber-500/50 text-amber-400/60 cursor-not-allowed bg-amber-950/30 placeholder-amber-800'
                  : letter
                    ? 'border-violet-400 text-white shadow-lg shadow-violet-500/20'
                    : 'border-gray-700 text-gray-300 focus:border-violet-500'
                }
              `}
              placeholder={isBanned ? '🚫' : currentWord?.[i]?.toUpperCase() ?? '_'}
            />
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-400 font-medium animate-slide-up">
          ⚠ {error}
        </p>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={disabled || letters.join('').length !== 4}
        className="
          mt-1 px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest
          bg-gradient-to-r from-violet-600 to-purple-600
          hover:from-violet-500 hover:to-purple-500
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-200 hover:scale-105 active:scale-95
          shadow-lg shadow-violet-900/40
        "
      >
        Submit Move
      </button>
    </div>
  );
}
