/**
 * gameController.js
 * Manages all game state and validates moves.
 *
 * Game Flow:
 *   Round 1: Human = Goal Seeker, AI   = Opponent
 *   Round 2: AI   = Goal Seeker, Human = Opponent
 *
 * Win Conditions:
 *   • Goal Seeker reaches goalWord           → Seeker wins this round
 *   • Goal Seeker has no valid moves left    → Opponent wins this round
 *   • Both win one round each                → Fewer moves wins overall
 */

const { isValidWord, getNeighbors, hammingDistance, changedPosition } = require('./dictionary');

// ── State store (single game; production would use session storage) ─────────
let state = null;

// ─────────────────────────────────────────────────────────────────────────────
// INITIALISE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Start a new game.
 * @param {string} startWord
 * @param {string} goalWord
 * @returns {object} initial game state
 */
function startGame(startWord, goalWord) {
  const sw = startWord.toLowerCase().trim();
  const gw = goalWord.toLowerCase().trim();

  if (!/^[a-z]{4}$/.test(sw)) throw new Error('Start word must be exactly 4 letters.');
  if (!/^[a-z]{4}$/.test(gw)) throw new Error('Goal word must be exactly 4 letters.');
  if (!isValidWord(sw)) throw new Error(`"${sw}" is not in the dictionary.`);
  if (!isValidWord(gw)) throw new Error(`"${gw}" is not in the dictionary.`);
  if (sw === gw) throw new Error('Start and goal words must differ.');

  state = {
    // ── Core words ─────────────────────────────────────────────
    startWord: sw,
    goalWord: gw,
    currentWord: sw,       // active word being transformed
    bannedPosition: null,  // position that cannot be changed this turn

    // ── History & used words ────────────────────────────────────
    usedWords: new Set([sw]),
    history: [{ word: sw, player: 'start', round: 1 }],

    // ── Roles ───────────────────────────────────────────────────
    // Round 1: human = seeker, AI = opponent
    // Round 2: AI   = seeker, human = opponent
    round: 1,
    humanRole: 'seeker',   // 'seeker' | 'opponent'
    aiRole: 'opponent',

    // ── Turn management ─────────────────────────────────────────
    // In round 1 the seeker (human) moves first.
    currentTurn: 'human',  // 'human' | 'ai'

    // ── Scores (move counts when winning) ───────────────────────
    scores: {
      round1Winner: null,  // 'human' | 'ai'
      round1Moves: 0,
      round2Winner: null,
      round2Moves: 0,
      overallWinner: null,
    },

    // ── Status ──────────────────────────────────────────────────
    moveCount: 0,
    status: 'playing',     // 'playing' | 'round_over' | 'game_over'
    message: `Game started! Transform "${sw.toUpperCase()}" → "${gw.toUpperCase()}". Human is the Goal Seeker.`,
  };

  return sanitiseState();
}

// ─────────────────────────────────────────────────────────────────────────────
// MOVE VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a move candidate.
 * @param {string} candidate - word the player wants to play
 * @param {string} player    - 'human' | 'ai'
 * @returns {{ valid: boolean, error?: string, position?: number }}
 */
function validateMove(candidate, player) {
  if (!state) return { valid: false, error: 'No active game.' };
  if (state.status !== 'playing') return { valid: false, error: 'Game is not in progress.' };
  if (state.currentTurn !== player) return { valid: false, error: `It is not ${player}'s turn.` };

  const word = candidate.toLowerCase().trim();

  // Structural checks
  if (!/^[a-z]{4}$/.test(word)) return { valid: false, error: 'Word must be exactly 4 lowercase letters.' };
  if (!isValidWord(word)) return { valid: false, error: `"${word}" is not a valid English word.` };
  if (state.usedWords.has(word)) return { valid: false, error: `"${word}" has already been used.` };

  // Letter-change check
  const pos = changedPosition(state.currentWord, word);
  if (pos === -1) return { valid: false, error: 'Move must change exactly one letter.' };

  // Banned position check
  if (state.bannedPosition !== null && pos === state.bannedPosition) {
    return {
      valid: false,
      error: `Position ${pos + 1} (letter "${state.currentWord[pos].toUpperCase()}") is banned this turn.`,
    };
  }

  return { valid: true, position: pos };
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLY MOVE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply a validated move to state.
 * @param {string} word     - validated new word
 * @param {number} position - which position changed
 * @param {string} player   - 'human' | 'ai'
 */
function applyMove(word, position, player) {
  state.usedWords.add(word);
  state.currentWord = word;
  state.bannedPosition = position;
  state.moveCount++;
  state.history.push({ word, player, round: state.round, position });

  // Check win: seeker reached goal
  if (word === state.goalWord) {
    const seekerIsHuman = state.humanRole === 'seeker';
    const roundWinner = seekerIsHuman ? 'human' : 'ai';
    _recordRoundWinner(roundWinner);
    return;
  }

  // Check dead-end: seeker has no valid moves after this move
  // Determine whose turn is NEXT
  const nextPlayer = player === 'human' ? 'ai' : 'human';
  const nextRole = nextPlayer === 'human' ? state.humanRole : state.aiRole;

  state.currentTurn = nextPlayer;

  if (nextRole === 'seeker') {
    // Check if seeker is now stuck
    const seekerMoves = getNeighbors(word, position, state.usedWords);
    if (seekerMoves.length === 0) {
      // Opponent wins the round
      const opponentIsHuman = state.humanRole === 'opponent';
      const roundWinner = opponentIsHuman ? 'human' : 'ai';
      _recordRoundWinner(roundWinner);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUND / GAME MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

function _recordRoundWinner(winner) {
  if (state.round === 1) {
    state.scores.round1Winner = winner;
    state.scores.round1Moves = state.moveCount;
    state.status = 'round_over';
    state.message = `Round 1 over! ${winner.toUpperCase()} wins Round 1 in ${state.moveCount} moves.`;
  } else {
    state.scores.round2Winner = winner;
    state.scores.round2Moves = state.moveCount;
    _resolveOverallWinner();
  }
}

function _resolveOverallWinner() {
  const { round1Winner, round2Winner, round1Moves, round2Moves } = state.scores;

  if (round1Winner === round2Winner) {
    state.scores.overallWinner = round1Winner;
    state.message = `${round1Winner.toUpperCase()} wins both rounds! Overall winner: ${round1Winner.toUpperCase()}.`;
  } else {
    // Tie-break by move count (fewer moves = better)
    if (round1Moves < round2Moves) {
      state.scores.overallWinner = round1Winner;
    } else if (round2Moves < round1Moves) {
      state.scores.overallWinner = round2Winner;
    } else {
      state.scores.overallWinner = 'draw';
    }
    state.message = `Tie-break! Overall winner: ${state.scores.overallWinner.toUpperCase()} (fewer moves).`;
  }

  state.status = 'game_over';
}

/**
 * Advance to Round 2: swap roles, reset word to start, keep used words.
 */
function startRound2() {
  if (state.status !== 'round_over') throw new Error('Round 1 is not finished.');

  // Swap roles
  state.humanRole = state.humanRole === 'seeker' ? 'opponent' : 'seeker';
  state.aiRole = state.aiRole === 'seeker' ? 'opponent' : 'seeker';

  // Reset word state (used words reset so a fresh path can be explored)
  state.currentWord = state.startWord;
  state.bannedPosition = null;
  state.usedWords = new Set([state.startWord]);
  state.moveCount = 0;
  state.round = 2;
  state.history.push({ word: state.startWord, player: 'start', round: 2 });

  // Round 2: seeker always moves first
  state.currentTurn = state.aiRole === 'seeker' ? 'ai' : 'human';
  state.status = 'playing';
  state.message = `Round 2 begins! Roles swapped. ${state.aiRole === 'seeker' ? 'AI' : 'Human'} is now the Goal Seeker.`;

  return sanitiseState();
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getState() {
  if (!state) throw new Error('No active game.');
  return sanitiseState();
}

/** Strip non-serialisable parts for JSON response */
function sanitiseState() {
  return {
    ...state,
    usedWords: [...state.usedWords],
  };
}

module.exports = { startGame, validateMove, applyMove, startRound2, getState };
