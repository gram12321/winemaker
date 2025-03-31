# AI-BRIEFING.md

## Winery Management Game – Architecture & Code Generation Guide

This briefing is for AI-assisted code generation for the **Winery Management Game**, a turn-based single-player simulation game.

---

### 🔧 Project Overview
Players manage a winery, including vineyard operations, wine production, building upgrades, staff, and sales. The game includes a simple economic engine with **formula-based wine prices** and **NPC buyers** — there is **no multiplayer or player-to-player interaction**.

---

### 💻 Frontend Architecture

- **Framework**: React + TypeScript
- **SPA Only**: No routing or Next.js. Use a `view` variable to switch between screens.
- **Styling**: Tailwind CSS only (no Bootstrap, no custom CSS in this iteration).
- **No overlays, sidebars, or panels** in layout.
- **Components** should be functional and minimal. Avoid unnecessary abstraction.

```tsx
// Example view switching
{view === "vineyard" && <Vineyard />}
{view === "production" && <WineProduction />}
{view === "finance" && <FinanceScreen />}
```

---

### 🧠 State & Logic

- Centralize all game data and logic in `gameState.ts`.
- Use TypeScript types for entities like:
  - `Player`, `WineBatch`, `Building`, `Staff`, `Transaction`, etc.
- Avoid `useState` and `useEffect` unless absolutely necessary.
- Game logic (e.g., production, quality calculations, finances) must not live in components.
- Access state via helper functions (`getGameState()`, `updatePlayerMoney()`, etc.).

---

### 🔌 Firebase Backend

- Use **Firebase Auth** for login.
- Use **Firestore** to load/save player state (on login, logout, or tick).
- Use **Firebase Functions** for:
  - Tick progression
  - Price calculations (e.g., land, wine, sales)
  - Simulated wine sales to NPC importers

> The game should run in memory during a session — no constant sync.

---

### 📈 Economic System

- The economy is **formula-based**, not dynamic or real-time.
- Wine prices, land values, and prestige scores are **calculated**, not simulated.
- Sales are resolved to randomized NPCs (non-interactive).

---

### ✅ AI Code Rules Summary

1. **React + TypeScript SPA**, no routing.
2. Use a single `view` switcher for navigation.
3. All state and logic in `gameState.ts`.
4. Avoid scattered hooks — central logic only.
5. Use Tailwind for styling.
6. No multiplayer, market, or trade logic.
7. Keep database interactions minimal.
8. Simulated NPC wine sales only — no real-time buyer simulation.

---

