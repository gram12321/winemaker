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
- **Styling**: Tailwind CSS, and Shadcn UI only (no Bootstrap, no custom CSS in this iteration).
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

### 💾 Database Services Architecture

- **All database operations** must be centralized in `src/lib/database/*` services.
- **Never** implement database operations directly in components, views, or other files.
- Service modules include:
  - `storageService.ts`: For localStorage operations
  - `companyService.ts`: For company CRUD operations
  - `gameStateService.ts`: For saving/loading full game state
  - `vineyardService.ts`: For vineyard-specific operations

```tsx
// CORRECT: Import and use database services
import { addVineyard } from '../lib/database/vineyardService';

// In component:
const handleAddVineyard = async () => {
  await addVineyard(vineyardData, true); // Second param = save to DB
};

// INCORRECT: Don't use Firebase directly in components
// ❌ import { doc, setDoc } from 'firebase/firestore';
// ❌ const docRef = doc(db, "collection", "id");
// ❌ await setDoc(docRef, data);
```

- Use the `saveToDb` boolean parameter (default: false) to control whether changes persist.
- Services should handle all error states and provide appropriate responses.
- New entity services should follow the same pattern (e.g., `buildingService.ts`).

---

### 📈 Economic System

- The economy is **formula-based**, not dynamic or real-time.
- Wine prices, land values, and prestige scores are **calculated**, not simulated.
- Sales are resolved to randomized NPCs (non-interactive).

---

### 🖥️ Display Management System

- The display management system in `src/lib/displayManager.ts` is a **special exception** to our rule of avoiding React hooks.
- This system ensures all UI components update when game state changes.
- Components can subscribe to updates using the `useDisplayUpdate` hook.
- Action handlers can be wrapped with `displayManager.createActionHandler` to automatically trigger updates.

```tsx
// In a component that needs to update when game state changes
import { useDisplayUpdate } from '../lib/displayManager';

const MyComponent = () => {
  // This hook automatically registers the component for updates
  useDisplayUpdate();
  
  // Component code...
};

// For action handlers that should trigger updates
import displayManager from '../lib/displayManager';

const handleAction = displayManager.createActionHandler(() => {
  // Action code that changes game state
  updateGameState({ /* changes */ });
});
```

- The display manager is a singleton service that manages component subscriptions and updates.
- It provides methods to register/unregister components and utility functions for wrapping action handlers.
- This approach is justified because it naturally integrates with React's component lifecycle, provides better performance, and simplifies component code.

---

### ✅ AI Code Rules Summary

1. **React + TypeScript SPA**, no routing.
2. Use a single `view` switcher for navigation.
3. All state and logic in `gameState.ts`.
4. Avoid scattered hooks — central logic only.
5. Use Tailwind for styling.
6. No multiplayer, market, or trade logic.
7. Keep database interactions minimal and **only in database services**.
8. Simulated NPC wine sales only — no real-time buyer simulation.
9. Use the display management system for UI updates (exception to the hooks rule).

---

