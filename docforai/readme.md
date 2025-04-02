# Winery Management Game Version 0.3

## Overview

Winery Management Game is a simulation game built with React and TypeScript that allows players to manage their own winery. The game encompasses multiple aspects including vineyard management, production, finance, and sales.

## Recent Updates

### Centralized Constants and Unified Game Date System
- Consolidated game constants into `src/lib/constants.ts`, including:
  - Time system constants (seasons, weeks per season, starting week, starting season, and starting year)
  - Financial constants (starting money and starting prestige)
  - Vineyard management constants (base yield, vine density, yield bonuses, organic certification details)

### Vineyard Specific Constants
- Created `src/lib/vineyardConstants.ts` to manage vineyard-related settings such as:
  - Grape varieties, aspect directions, and farming methods
  - Country and region mappings
  - Soil types and altitude ranges by region
  - Aspect factors for land value calculation

### Game State and Game Tick Updates
- Updated `src/gameState.ts` this is were gametime resident 

### Display Management System
- Implemented a React-based display management system in `src/lib/displayManager.ts`
- This system uses React hooks as an exception to our general rule of avoiding hooks
- The display manager ensures all UI components update when game state changes
- Components can subscribe to updates using the `useDisplayUpdate` hook
- Action handlers can be wrapped with `displayManager.createActionHandler` to automatically trigger updates

A web-based simulation game where players manage their own winery, from vineyard operations to wine production and sales.
This is a new iteration of the 0.25 build

Look in @readme_old.md for the old readme describing the entire content of the game. 

Changes from 0.25
 - Introduces React, typescript, tailwind and Shadcn UI
 - We are still running SPA but we use react Views instead of overlays. No more Bootstrap
 - Mail layout is now a topbar, not a sidebar, no panel, no permanent console
 - We still have the @console but now we use toast UI and have a permanent message history
 - Centralized database architecture in `src/lib/database/` - all Firebase and localStorage operations must use these services

## Architecture Highlights

### Database Services
All database operations are centralized in dedicated service modules:
- `src/lib/database/storageService.ts`: For localStorage operations
- `src/lib/database/companyService.ts`: For company-related Firebase operations 
- `src/lib/database/gameStateService.ts`: For saving/loading the full game state
- `src/lib/database/vineyardService.ts`: For vineyard-specific operations

Do **not** implement database operations directly in components or views! Import the appropriate service instead.

### Display Management System

The display management system is a special case where we use React hooks despite our general rule of avoiding them. This exception is justified for the following reasons:

1. **Component Lifecycle Integration**: Hooks naturally integrate with React's component lifecycle, automatically handling registration on mount and cleanup on unmount.

2. **Declarative Approach**: The hook-based approach is more declarative, making it clear which components need to update when game state changes.

3. **Performance Optimization**: React's built-in state management through hooks allows for more efficient rendering.

4. **Simplified Component Code**: Components using the hook don't need to implement complex subscription logic themselves.

5. **TypeScript Integration**: The hook approach works seamlessly with TypeScript, providing better type safety.

6. **Consistent with React Patterns**: This approach aligns with React's recommended patterns for side effects and state management.

#### Usage Examples

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