# CHROMA COMMAND: THE LIVING PROTOCOL

Asymmetrical Web3 competitive strategy game on Monad.

## Project Structure

```
chroma-command/
├── frontend/                  # React + Three.js game client (COMPLETE)
│   ├── src/
│   │   ├── components/        # All game UI + 3D components
│   │   ├── store/             # Zustand state management
│   │   ├── utils/             # Grid generation + environment AI
│   │   ├── hooks/             # WebGL detection + turn timer
│   │   └── styles/            # Obsidian Ember CSS palette
│   ├── package.json
│   └── README.md
│
├── BACKEND_AI_PROMPT.md       # Paste into AI to build the backend
└── README.md                  # This file
```

## Frontend — Start Now

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## Backend — Build With AI

Open `BACKEND_AI_PROMPT.md` and paste the prompt into Claude, Cursor, or any AI coding tool.
It will generate the complete Node.js + Express + WebSocket backend.

## Game Flow

```
Menu → Commander Select → [Matchmaking] → 3D Hex Grid Game → Victory Screen
```

- Two players race to 500 Resonance Points
- 2 actions per turn: Harvest / Attack / Build
- The Chroma Field (living AI environment) adapts and fights back
- No direct PvP — all conflict is indirect through shared resources
- Environmental events fire every 2-4 turns, triggered by Interference meter

## Commanders

| Commander | Specialty | Bonus |
|-----------|-----------|-------|
| The Forge | Harvesting | +10 pts per harvest, Interference → crystals |
| The Echo | Combat | +20 pts per anomaly kill |
| The Bastion | Building | Faster builds, conduit durability |
| The Mirage | Information | Preview events, plant decoys |

## Tech Stack

| Layer | Tech |
|-------|------|
| 3D Engine | Three.js via React Three Fiber |
| UI | React 18 + TypeScript + Framer Motion |
| State | Zustand |
| Styling | Tailwind CSS + CSS Variables |
| Fonts | Cinzel + Rajdhani + Share Tech Mono |
| Backend (TBD) | Node.js + Express + WebSocket |
| Chain | Monad (EVM) |
