/**
 * server.js
 * Express REST API for the Adversarial Word Transformation Game.
 *
 * Endpoints:
 *   POST /start-game   – initialise a new game
 *   POST /make-move    – human submits a word
 *   POST /ai-move      – trigger the AI to play its turn
 *   POST /next-round   – advance to round 2
 *   GET  /game-state   – fetch current state without mutation
 */

const express = require('express');
const cors = require('cors');
const { startGame, validateMove, applyMove, startRound2, getState } = require('./gameController');
const { seekerMove, opponentMove } = require('./aiEngine');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Helper ────────────────────────────────────────────────────────────────────
const send = (res, data) => res.json({ success: true, ...data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, error: message });

// ─────────────────────────────────────────────────────────────────────────────
// POST /start-game
// Body: { startWord: string, goalWord: string }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/start-game', (req, res) => {
  try {
    const { startWord, goalWord } = req.body;
    if (!startWord || !goalWord) return fail(res, 'Both startWord and goalWord are required.');
    const state = startGame(startWord, goalWord);
    send(res, { state });
  } catch (err) {
    fail(res, err.message);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /make-move
// Body: { word: string }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/make-move', (req, res) => {
  try {
    const { word } = req.body;
    if (!word) return fail(res, 'word is required.');

    const validation = validateMove(word, 'human');
    if (!validation.valid) return fail(res, validation.error);

    applyMove(word, validation.position, 'human');
    const state = getState();
    send(res, { state });
  } catch (err) {
    fail(res, err.message);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /ai-move
// No body required – AI calculates its own move
// ─────────────────────────────────────────────────────────────────────────────
app.post('/ai-move', (req, res) => {
  try {
    const state = getState();

    if (state.status !== 'playing') return fail(res, 'Game is not in playing state.');
    if (state.currentTurn !== 'ai') return fail(res, "It is not the AI's turn.");

    const { currentWord, goalWord, bannedPosition, aiRole } = state;
    const usedSet = new Set(state.usedWords);

    let aiResult;

    if (aiRole === 'seeker') {
      // AI tries to reach the goal
      aiResult = seekerMove(currentWord, goalWord, bannedPosition, usedSet);
    } else {
      // AI tries to trap the human seeker
      // In opponent role the AI's "seekerWord" is whatever the human currently sits at
      aiResult = opponentMove(currentWord, state.currentWord, goalWord, bannedPosition, usedSet);
    }

    if (!aiResult) {
      // AI is stuck — the other player wins this round
      // Trigger stuck logic by returning state as-is with a stuck flag
      applyMove(currentWord, bannedPosition, 'ai'); // re-apply current to trigger dead-end check
      return send(res, { state: getState(), aiStuck: true });
    }

    applyMove(aiResult.word, aiResult.position, 'ai');
    send(res, { state: getState(), aiWord: aiResult.word, aiPosition: aiResult.position });
  } catch (err) {
    fail(res, err.message);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /next-round
// ─────────────────────────────────────────────────────────────────────────────
app.post('/next-round', (req, res) => {
  try {
    const state = startRound2();
    send(res, { state });
  } catch (err) {
    fail(res, err.message);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /game-state
// ─────────────────────────────────────────────────────────────────────────────
app.get('/game-state', (req, res) => {
  try {
    send(res, { state: getState() });
  } catch (err) {
    fail(res, err.message, 404);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎮 Word Game API running at http://localhost:${PORT}`);
  console.log('   Routes: POST /start-game | POST /make-move | POST /ai-move | POST /next-round | GET /game-state');
});
