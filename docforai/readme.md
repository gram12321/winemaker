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