# ⚔ Word Duel — Adversarial Word Transformation Game

A full-stack two-player word game between a **Human** and an **AI**, built with **React + Tailwind CSS** (frontend) and **Node.js + Express** (backend).

---

## 🧠 How It Works

Transform a 4-letter word into a goal word, **one letter at a time**:

```text
COLD → CORD → WORD → WARD → WARM
```

**Rules:**
- Change exactly **one letter** per move.
- Must always be a **valid English word**.
- No word can be **reused**.
- Cannot modify the **same position** as the previous move (banned position).

---

## 🎮 Game Modes

| Round | Human Role    | AI Role      |
|-------|--------------|-------------|
| 1     | 🎯 Goal Seeker | 🛡 Opponent  |
| 2     | 🛡 Opponent   | 🎯 Goal Seeker |

**Win Conditions:**
- Goal Seeker reaches the goal word → Seeker wins.
- Goal Seeker gets stuck (no valid moves) → Opponent wins.
- Both win one round each → Fewer total moves wins.

---

## 🤖 AI Logic & Engine

### Goal Seeker AI — Greedy Best First Search
- Heuristic: **Hamming Distance** `h(word, goal) = # differing letters`
- Picks the neighbor with the minimum distance to goal
- Tie-break: prefers moves with higher future mobility

### Opponent AI — Minimax + Alpha-Beta Pruning (depth 2)
Evaluation function:
```text
Eval = 0.4 × mobility
     + 0.5 × trap_potential
     + 0.1 × distance_from_path
```
- `mobility` = opponent's own future valid moves
- `trap_potential` = how few moves the seeker has (more trapped = better)
- `distance_from_path` = opponent drifts away from goal area

### 🔒 AI Safety & Integration
The project is built to accommodate advanced LLM logic (like Google's Gemini). API keys and sensitive environment variables are strictly managed via `.env` files. 

**Important:** Never hardcode your `GEMINI_API_KEY` (e.g. `const API_KEY = 'sk-...';`). The engine instead loads it safely via `process.env.GEMINI_API_KEY`.

---

## 📁 Project Structure

```text
AIProject/
├── .gitignore             # Optimized for Node, Mac, Editor junk, and AI Secrets
├── backend/
│   ├── .env               # Environment variables (NOT tracked in git)
│   ├── server.js          # Express REST API
│   ├── aiEngine.js        # AI Engine with secure env var loading
│   ├── gameController.js  # Game state management & validation
│   ├── dictionary.js      # O(1) Word pattern indexing 
│   └── wordlist.txt       # Dictionary of 4-letter English words
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api/gameApi.js      # Communicates with Node backend
│   │   ├── components/         # Reusable React UI components
│   │   └── pages/              # Game & Setup screen layouts
│   ├── index.html
│   └── package.json
│
└── README.md              # You are here!
```

---

## ⚙️ API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/start-game` | `{ startWord, goalWord }` → new game |
| `POST` | `/make-move`  | `{ word }` → human plays |
| `POST` | `/ai-move`    | triggers AI turn |
| `POST` | `/next-round` | advance to Round 2 |
| `GET`  | `/game-state` | returns full game state |

---

## 🚀 Setup & Running

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### 1. Environment Variables Setup
Create a `.env` file in the `backend` folder and add your Gemini API Key if you intend to enable the advanced LLM integrations:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(The `.gitignore` will ensure this file is never committed.)*

### 2. Backend Server

```bash
cd backend
npm install
npm start
# API running at http://localhost:3001
```

### 3. Frontend App

```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:5173
```

Open **http://localhost:5173** in your browser to start playing!

---

## 🎯 Sample Game: COLD → WARM

```text
COLD (start)
 ↓ Human changes position 1 (C→W)
WOLD
 ↓ AI changes position 4 (D→K) — tries to trap
WOLK          ← (Invalid move blocked by engine)
...
WARM (goal!) — Human wins Round 1
```

---

## 📖 Dictionary

Uses the system dictionary filtered to exactly **4-letter lowercase words** (~4,360 words).
A **pattern index** hashmap provides O(1) neighbor lookup:
```json
"_old": ["bold", "cold", "fold", "gold", "hold", "mold", "sold", "told"]
```

## ✅ Performance
- AI move computation: **< 100ms**
- Pattern index build time: **~10ms** on server start
- All API responses: **< 50ms** typical
