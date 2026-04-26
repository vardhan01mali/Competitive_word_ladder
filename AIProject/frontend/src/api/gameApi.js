// api/gameApi.js – thin wrapper around the backend REST API

const BASE = 'http://localhost:3001';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Unknown error');
  return data;
}

export const api = {
  startGame: (startWord, goalWord) =>
    request('POST', '/start-game', { startWord, goalWord }),

  makeMove: (word) =>
    request('POST', '/make-move', { word }),

  aiMove: () =>
    request('POST', '/ai-move'),

  nextRound: () =>
    request('POST', '/next-round'),

  getState: () =>
    request('GET', '/game-state'),
};
