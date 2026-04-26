// App.jsx
// Root component — switches between SetupPage and GamePage.

import { useState } from 'react';
import SetupPage from './pages/SetupPage';
import GamePage from './pages/GamePage';

export default function App() {
  const [gameState, setGameState] = useState(null);

  function handleStart(state) {
    setGameState(state);
  }

  function handleNewGame() {
    setGameState(null);
  }

  return gameState
    ? <GamePage initialState={gameState} onNewGame={handleNewGame} />
    : <SetupPage onStart={handleStart} />;
}
