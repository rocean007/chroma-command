# CHROMA COMMAND: THE LIVING PROTOCOL — Frontend

Asymmetrical Web3 strategy game built with React + Three.js on Monad.

## Stack

- **React 18** + TypeScript + Vite
- **Three.js** via React Three Fiber + Drei (3D hex grid)
- **Framer Motion** (UI animations)
- **Zustand** (game state + environment state)
- **Tailwind CSS** (utility styling)
- **Google Fonts**: Cinzel (display), Rajdhani (body), Share Tech Mono (data)

## Quick Start

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── GameBoard.tsx        # Three.js canvas + scene composition
│   ├── HexGrid.tsx          # Procedural hex tiles (R3F)
│   ├── ResourceNode.tsx     # 3D crystal clusters
│   ├── Anomaly.tsx          # 3D enemy units
│   ├── Conduit.tsx          # Player structures
│   ├── PlayerHUD.tsx        # Score, timer, action bar
│   ├── EnvironmentPanel.tsx # Interference + event panel
│   ├── CommanderSelect.tsx  # Commander picker screen
│   ├── MatchmakingQueue.tsx # Queue UI
│   ├── Leaderboard.tsx      # Rankings screen
│   ├── EventToast.tsx       # Environmental event popup
│   └── VictoryScreen.tsx    # End-of-match screen
├── store/
│   ├── gameStore.ts         # Zustand: players, turns, actions
│   └── environmentStore.ts  # Zustand: interference, events
├── utils/
│   ├── gridGenerator.ts     # Hex math + procedural layout
│   └── environmentAI.ts     # Event weights + AI action logic
├── hooks/
│   ├── useWebGL.ts          # WebGL detection
│   └── useTurnTimer.ts      # 45s countdown hook
└── styles/
    └── globals.css          # Obsidian Ember palette + components
```

## Color Palette — Obsidian Ember

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary-bg` | #2D2A26 | Background |
| `--secondary-bg` | #8B3A2B | UI panels |
| `--accent-active` | #E85D04 | Player 1, buttons |
| `--accent-critical` | #FFB703 | Scores, timers |
| `--text-primary` | #F5F2EB | Body text |
| `--text-error` | #A41623 | Errors |
| `--text-success` | #6A994E | Positive actions |
| `--terrain` | #3E3B37 | Hex tiles |
| `--resource` | #F48C06 | Crystal nodes |
| `--enemy` | #BA181B | Anomalies |
| `--neutral` | #9C7A4D | UI labels |
| `--structure` | #D4AF37 | Conduits, Player 2 |

## Connecting the Backend

Once you have the backend running (see backend README), update `.env`:

```
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

Then replace the mock matchmaking in `MatchmakingQueue.tsx` with real WebSocket events and the mock leaderboard in `Leaderboard.tsx` with a fetch to `GET /api/leaderboard`.
