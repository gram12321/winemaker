# Display Management System

## Overview

The Display Management System is a special exception to our general rule of avoiding React hooks. It provides a centralized way to update UI components when game state changes, ensuring that all displays remain in sync with the underlying data.

## Why Hooks in This Case?

While our general architecture rule is to avoid React hooks, the display management system is a justified exception for the following reasons:

1. **Component Lifecycle Integration**: Hooks naturally integrate with React's component lifecycle, automatically handling registration on mount and cleanup on unmount. This prevents memory leaks and ensures components only receive updates when they're actually mounted.

2. **Declarative Approach**: The hook-based approach is more declarative, making it clear which components need to update when game state changes. This improves code readability and maintainability.

3. **Performance Optimization**: React's built-in state management through hooks allows for more efficient rendering. Components only re-render when necessary, rather than on every game state change.

4. **Simplified Component Code**: Components using the hook don't need to implement complex subscription logic themselves - they just call `useDisplayUpdate()` and everything is handled automatically.

5. **TypeScript Integration**: The hook approach works seamlessly with TypeScript, providing better type safety and developer experience.

6. **Consistent with React Patterns**: This approach aligns with React's recommended patterns for side effects and state management, making it more intuitive for React developers.

## Architecture

The display management system consists of:

1. **DisplayManager Class**: A singleton service that manages component subscriptions and updates.
2. **useDisplayUpdate Hook**: A React hook for components to subscribe to updates.
3. **Action Handler Utilities**: Functions to wrap action handlers with automatic display updates.

## Usage

### In Components

```tsx
import { useDisplayUpdate } from '../lib/displayManager';

const MyComponent = () => {
  // This hook automatically registers the component for updates
  useDisplayUpdate();
  
  // Get current game state
  const gameState = getGameState();
  
  // Component code...
};
```

### For Action Handlers

```tsx
import displayManager from '../lib/displayManager';

const handleAction = displayManager.createActionHandler(() => {
  // Action code that changes game state
  updateGameState({ /* changes */ });
});
```

## Integration with Game State

The display management system is integrated with the game state system to automatically update displays when game state changes:

1. **gameState.ts**: Calls `displayManager.updateAllDisplays()` when game state changes.
2. **gameTick.ts**: Calls `displayManager.updateAllDisplays()` after game ticks and events.

## Best Practices

1. **Use the Hook in Components**: Always use the `useDisplayUpdate` hook in components that display game state.
2. **Wrap Action Handlers**: Use `displayManager.createActionHandler` for action handlers that change game state.
3. **Avoid Direct DOM Manipulation**: Never directly manipulate the DOM in components - let React handle rendering.
4. **Keep Components Simple**: Components should focus on rendering and user interaction, not game logic.

## Example Component

### Status Component

```tsx
import React from 'react';
import { getGameState } from '../gameState';
import { useDisplayUpdate } from '../lib/displayManager';

const Status: React.FC = () => {
  // Use our display update hook to automatically refresh when game state changes
  useDisplayUpdate();
  
  // Get current game state
  const gameState = getGameState();
  const { player, week, season, currentYear } = gameState;
  
  if (!player) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold text-wine mb-3">Company Status</h2>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-sm text-gray-500">Company</p>
          <p className="font-medium">{player.companyName}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Current Date</p>
          <p className="font-medium">Week {week}, {season} {currentYear}</p>
        </div>
        
        {/* More status information */}
      </div>
    </div>
  );
};

export default Status;
``` 