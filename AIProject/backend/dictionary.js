/**
 * dictionary.js
 * Loads and indexes the 4-letter word list for fast lookup.
 *
 * Pattern Index:
 *   Key = word with one position masked by '_'
 *   e.g., "cold" → ["_old", "c_ld", "co_d", "col_"]
 *   This allows O(1) neighbor lookup instead of scanning every word.
 */

const fs = require('fs');
const path = require('path');

// ── Load word list ──────────────────────────────────────────────────────────
const RAW = fs.readFileSync(path.join(__dirname, 'wordlist.txt'), 'utf8');

/** Set of all valid 4-letter words (lowercase) */
const wordSet = new Set(
  RAW.split('\n')
    .map(w => w.trim().toLowerCase())
    .filter(w => /^[a-z]{4}$/.test(w))
);

// ── Build pattern index ─────────────────────────────────────────────────────
/**
 * patternIndex: Map<string, string[]>
 * Example: "_old" → ["bold", "cold", "fold", "gold", "hold", "mold", "sold", "told"]
 */
const patternIndex = new Map();

for (const word of wordSet) {
  for (let i = 0; i < 4; i++) {
    const key = word.slice(0, i) + '_' + word.slice(i + 1);
    if (!patternIndex.has(key)) patternIndex.set(key, []);
    patternIndex.get(key).push(word);
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Check if a word is in the dictionary.
 * @param {string} word
 * @returns {boolean}
 */
function isValidWord(word) {
  return wordSet.has(word.toLowerCase());
}

/**
 * Get all valid neighbors of `word`:
 *   - differ by exactly one letter
 *   - not in `usedWords`
 *   - not modifying position `bannedPos` (if set)
 *
 * @param {string} word           - current 4-letter word
 * @param {number|null} bannedPos - 0-indexed position forbidden to change
 * @param {Set<string>} usedWords - words already played
 * @returns {string[]}            - list of valid neighbor words
 */
function getNeighbors(word, bannedPos, usedWords = new Set()) {
  const neighbors = [];
  const w = word.toLowerCase();

  for (let i = 0; i < 4; i++) {
    // Skip the banned position
    if (bannedPos !== null && bannedPos !== undefined && i === bannedPos) continue;

    const pattern = w.slice(0, i) + '_' + w.slice(i + 1);
    const candidates = patternIndex.get(pattern) || [];

    for (const candidate of candidates) {
      // Must differ (can't be the same word)
      if (candidate === w) continue;
      // Must not have been used
      if (usedWords.has(candidate)) continue;
      neighbors.push(candidate);
    }
  }

  return neighbors;
}

/**
 * Hamming distance between two equal-length strings.
 * Counts the number of positions where characters differ.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function hammingDistance(a, b) {
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

/**
 * Determine which position changed between two words.
 * Returns -1 if not exactly one position differs.
 * @param {string} from
 * @param {string} to
 * @returns {number}
 */
function changedPosition(from, to) {
  let pos = -1;
  let count = 0;
  for (let i = 0; i < 4; i++) {
    if (from[i] !== to[i]) {
      pos = i;
      count++;
    }
  }
  return count === 1 ? pos : -1;
}

module.exports = { isValidWord, getNeighbors, hammingDistance, changedPosition, wordSet };
