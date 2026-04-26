/**
 * aiEngine.js
 * Implements AI logic for both game roles:
 *
 *  ┌─────────────────────────────────────────────────────────┐
 *  │  GOAL SEEKER AI  — Greedy Best First Search             │
 *  │  Heuristic: Hamming Distance h(word, goal)              │
 *  │  Greedily picks neighbor closest to goal each turn.     │
 *  ├─────────────────────────────────────────────────────────┤
 *  │  OPPONENT AI  — Weighted Evaluation Function            │
 *  │  Score = 0.4*mobility + 0.5*trapPotential               │
 *  │         + 0.1*distanceFromPath                          │
 *  │  Picks move that maximises adversarial score.           │
 *  └─────────────────────────────────────────────────────────┘
 */

const { getNeighbors, hammingDistance, changedPosition } = require('./dictionary');

const API_KEY = process.env.GEMINI_API_KEY; // Left empty/unassigned for now

// ─────────────────────────────────────────────────────────────────────────────
// GOAL SEEKER AI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Greedy Best First Search step for the Goal Seeker AI.
 *
 * At each turn the seeker picks the valid neighbor that minimises
 * Hamming distance to the goal word.  A tie-break prefers words
 * with more available next-moves (higher mobility) to avoid traps.
 *
 * @param {string}      currentWord  - the word the AI is at
 * @param {string}      goalWord     - the target word
 * @param {number|null} bannedPos    - position the AI cannot change
 * @param {Set<string>} usedWords    - words already played in this game
 * @returns {{ word: string, position: number } | null}
 *          The chosen word and the position that changed, or null if stuck.
 */
function seekerMove(currentWord, goalWord, bannedPos, usedWords) {
  const neighbors = getNeighbors(currentWord, bannedPos, usedWords);

  if (neighbors.length === 0) return null; // AI is stuck

  // Score each neighbor: primary = hamming to goal (lower better)
  //                      secondary = mobility (higher better as tiebreak)
  let best = null;
  let bestScore = Infinity;

  for (const neighbor of neighbors) {
    const h = hammingDistance(neighbor, goalWord);
    // Penalise low-mobility options slightly (avoid walking into dead ends)
    const futureNeighbors = getNeighbors(neighbor, changedPosition(currentWord, neighbor), usedWords);
    const mobility = futureNeighbors.length;

    // Composite score: minimise h, maximise mobility
    const score = h - 0.01 * mobility;

    if (score < bestScore) {
      bestScore = score;
      best = neighbor;
    }
  }

  if (!best) return null;

  return {
    word: best,
    position: changedPosition(currentWord, best),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// OPPONENT AI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the Opponent AI evaluation score for a candidate move.
 *
 * Components:
 *  mobility         = how many valid moves the seeker has AFTER the AI plays here
 *  trapPotential    = how few valid moves the seeker's NEXT neighbors offer
 *                     (deep trap: seeker ends up in a dead-end zone)
 *  distanceFromPath = how far the AI drifts from the seeker's shortest path
 *                     (forces detour, uses up seeker's options)
 *
 * Weights chosen to prioritise trapping over position:
 *   Eval = 0.4*mobility + 0.5*trapPotential + 0.1*distanceFromPath
 *
 *  NOTE: for Opponent AI "better" means LOWER seeker mobility, so we negate
 *  where needed.
 *
 * @param {string}      candidate   - word the Opponent AI is considering
 * @param {string}      seekerWord  - seeker's current word
 * @param {string}      goalWord    - seeker's goal
 * @param {number}      changedPos  - position changed to reach candidate
 * @param {Set<string>} usedWords
 * @returns {number}
 */
function opponentEval(candidate, seekerWord, goalWord, changedPos, usedWords) {
  // 1. Mobility: number of valid moves available from candidate position
  //    (the opponent's own future flexibility — higher = better for opponent)
  const myNextMoves = getNeighbors(candidate, changedPos, usedWords);
  const mobility = myNextMoves.length;

  // 2. Trap potential: minimise the seeker's future options
  //    Look at what moves the seeker can make from seekerWord given that
  //    candidate is now used.  Fewer seeker moves = higher trap score.
  const seekerMoves = getNeighbors(seekerWord, null, usedWords);
  const seekerMobility = seekerMoves.length;
  // Invert: higher value = seeker is more trapped
  const trapPotential = Math.max(0, 10 - seekerMobility);

  // 3. Distance from path: how far candidate drifts from the seeker's goal
  //    Opponent placing words near goal is counter-productive; drift away.
  const myDistToGoal = hammingDistance(candidate, goalWord);
  // Normalise to [0,1] range for a 4-letter word (max dist = 4)
  const distanceFromPath = myDistToGoal / 4;

  // Weighted evaluation
  return 0.4 * mobility + 0.5 * trapPotential + 0.1 * distanceFromPath;
}

/**
 * Minimax with Alpha-Beta Pruning for Opponent AI (depth ≤ 3).
 *
 * The Opponent (maximiser) tries to maximise the evaluation score.
 * The Seeker (minimiser) tries to minimise it (reach goal = low h).
 *
 * For performance we limit depth to 2 by default.
 *
 * @param {string}      word
 * @param {string}      seekerWord
 * @param {string}      goalWord
 * @param {number|null} bannedPos
 * @param {Set<string>} usedWords
 * @param {number}      depth
 * @param {number}      alpha
 * @param {number}      beta
 * @param {boolean}     isMaximiser
 * @returns {number}
 */
function minimax(word, seekerWord, goalWord, bannedPos, usedWords, depth, alpha, beta, isMaximiser) {
  if (depth === 0) {
    return opponentEval(word, seekerWord, goalWord, bannedPos, usedWords);
  }

  const neighbors = getNeighbors(word, bannedPos, usedWords);

  if (neighbors.length === 0) {
    // Terminal: if maximiser is stuck opponent is trapped (bad), seeker wins
    return isMaximiser ? -Infinity : Infinity;
  }

  if (isMaximiser) {
    let maxEval = -Infinity;
    for (const n of neighbors) {
      const pos = changedPosition(word, n);
      const newUsed = new Set(usedWords);
      newUsed.add(n);
      const val = minimax(n, seekerWord, goalWord, pos, newUsed, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break; // β cut-off
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const n of neighbors) {
      const pos = changedPosition(word, n);
      const newUsed = new Set(usedWords);
      newUsed.add(n);
      const val = minimax(n, seekerWord, goalWord, pos, newUsed, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break; // α cut-off
    }
    return minEval;
  }
}

/**
 * Opponent AI move selection using Minimax + Alpha-Beta (depth=2).
 *
 * Falls back to greedy evaluation if no minimax improvement found.
 *
 * @param {string}      currentWord
 * @param {string}      seekerWord  - where the seeker currently sits
 * @param {string}      goalWord
 * @param {number|null} bannedPos
 * @param {Set<string>} usedWords
 * @returns {{ word: string, position: number } | null}
 */
function opponentMove(currentWord, seekerWord, goalWord, bannedPos, usedWords) {
  const neighbors = getNeighbors(currentWord, bannedPos, usedWords);

  if (neighbors.length === 0) return null;

  let best = null;
  let bestScore = -Infinity;

  for (const neighbor of neighbors) {
    const pos = changedPosition(currentWord, neighbor);
    const newUsed = new Set(usedWords);
    newUsed.add(neighbor);

    // Minimax look-ahead (depth 2, opponent is maximiser)
    const score = minimax(
      neighbor,
      seekerWord,
      goalWord,
      pos,
      newUsed,
      2,          // depth
      -Infinity,
      Infinity,
      false       // after opponent moves, seeker plays (minimiser)
    );

    if (score > bestScore) {
      bestScore = score;
      best = neighbor;
    }
  }

  if (!best) return null;

  return {
    word: best,
    position: changedPosition(currentWord, best),
  };
}

module.exports = { seekerMove, opponentMove };
