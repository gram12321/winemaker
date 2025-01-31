# Winery Management Game

A web-based simulation game where players manage their own winery, from vineyard operations to wine production and sales.

## Project Statistics
- Total Files: 61 files
- Total Lines of Code: 12,322
- Primary Language: JavaScript (9,091 lines)
- Secondary Languages: CSS (2,517 lines), HTML (714 lines)

## Features

- **Vineyard Management**: Plant, maintain, and harvest various grape varieties with vine aging
- **Production Facilities**: Build and upgrade buildings with maintenance system
- **Staff Management**: Hire and manage staff with task assignments
- **Wine Production**: Complete wine-making process from crushing to aging
- **Financial System**: Financial tracking with bookkeeping and transactions
- **Resource Management**: Inventory system with storage management
- **Farmland Management**: Land acquisition and management with quality factors
- **Harvesting**: Harvesting mechanics with timing and quality tracking
- **Task System**: Task management with staff allocation
- **Wine Orders**: Order generation and fulfillment system
- **Prestige System**: Company reputation based on assets and performance

### New Features
- **Team Management**: Create and manage specialized teams for different vineyard operations
- **Upgrade System**: Research and implement vineyard improvements
- **Enhanced Building System**: Expanded building maintenance and tool management
- **Advanced Farmland Health**: Dynamic field health system affected by management decisions
- **Improved Financial Tools**: Enhanced bookkeeping and transaction tracking

### Team Management System (teamManagementOverlay.js)
- Team creation and assignment
- Specialized role management
- Team performance tracking
- Team-based task allocation

### Upgrade System (upgrade.js)
- Research and development options
- Vineyard improvements
- Building upgrades
- Technology advancements
- Production efficiency enhancements

## Project Structure & Functions

## Core Systems & Functions

### Farmland System (farmland.js - 446 lines)
- `Farmland` class: Core class managing field properties and calculations
- `calculateLandvalue()`: Determines land value based on region, altitude, aspect
- `farmlandAgePrestigeModifier()`: Calculates prestige based on vine age
- `calculateFarmlandPrestige()`: Computes overall field prestige
- `farmlandYield()`: Calculates expected yield based on multiple factors
- `createFarmland()`: Generates new farmland with randomized or specified attributes

### Land Acquisition (buyLandOverlay.js - 135 lines)
- `showBuyLandOverlay()`: Displays available land for purchase
- Land value calculation based on:
  - Regional prestige rankings
  - Altitude benefits
  - Aspect ratings
  - Soil composition

### Harvesting System (harvestOverlay.js - 144 lines)
- `harvest()`: Manages grape collection and quality calculation
- Quality determined by:
  - Annual quality factor
  - Ripeness level
  - Field prestige
  - Farmland health
- Integrates with storage system for harvest collection

### Vineyard Management (vineyard.js - 72 lines)
- `harvestField()`: Manages grape harvesting
- `calculateYield()`: Determines harvest amounts
- `validateStorage()`: Checks storage availability
- `calculateQuality()`: Computes grape quality based on conditions

### Buildings System (buildings.js - 312 lines)
- `buildBuilding()`: Creates new buildings
- `upgradeBuilding()`: Handles building upgrades
- `updateBuildingCards()`: Updates UI for buildings
- `getBuildingTools()`: Retrieves available tools for buildings
- `createTool()`: Instantiates new building tools

### Resource Management (resource.js - 247 lines)
- `Resource` class: Base class for game resources
- `Inventory` class: Manages game inventories
- `sellWines()`: Handles wine sales
- `populateStorageTable()`: Updates storage UI
- `displayInventory()`: Shows current inventory

### Staff Management (staff.js - 236 lines)
- `hireStaff()`: Handles staff recruitment
- `updateStaffWages()`: Manages salary payments
- `assignStaffToTask()`: Task management
- `setupStaffWagesRecurringTransaction()`: Sets up payroll
- `updateWagesAndRecurringTransaction()`: Updates staff payments

### Financial System (finance.js - 132 lines)
- `addTransaction()`: Records financial transactions
- `updateCashflow()`: Manages money flow
- `calculateBalance()`: Computes current balance
- `processRecurringTransactions()`: Handles regular payments

### Production System
#### Crushing Process (crushingOverlay.js - 167 lines)
- `showCrushingOverlay()`: Displays crushing interface
- `handleCrushing()`: Processes grape crushing
- `updateMustStorage()`: Manages must storage
- `calculateMustQuality()`: Determines must quality

#### Wine Processing (wineprocessing.js)
- `fermentMust()`: Manages fermentation process
- `agingProcess()`: Handles wine aging
- `calculateWineQuality()`: Determines final wine quality

### Database Layer
#### Admin Functions (adminFunctions.js - 394 lines)
- `saveCompanyInfo()`: Persists company data
- `loadBuildings()`: Retrieves building data
- `clearLocalStorage()`: Resets game state
- `saveTask()`: Stores task information
- `loadTasks()`: Retrieves active tasks

#### Firebase Integration (firebase.js - 19 lines)
- Database configuration
- Real-time data synchronization
- Cloud storage integration

### UI Components
#### Sidebar System (loadSidebar.js - 243 lines)
- `initializeSidebar()`: Sets up game sidebar
- `renderCompanyInfo()`: Updates company display
- `calculateCompanyPrestige()`: Computes prestige score
- `applyPrestigeHit()`: Handles prestige penalties
- `decayPrestigeHit()`: Manages prestige recovery


## Known Issues
- Sidebar toggle collapse state issues with main window spacing
- Tooltip display issues in collapsed sidebar
- Save/load functionality for owned land and staff needs improvement
- Multiple building/maintenance tasks can be created for same building
- Building name display issues in task boxes
- Winery tasks don't properly update UI without page refresh
- Missing prestige hit for incomplete bookkeeping tasks

## Planned Improvements
- Enhanced planting mechanics with vine age system
- Improved vineyard cycle (harvest, pruning, trimming)
- Better task management UI
- Enhanced wine order grouping and filtering
- Improved building maintenance information display

## Integration Points
- Firebase Database Integration (firebase.js)
- Resource Management System (resource.js)
- Financial Transaction System (finance.js)

### Development plan

| Tool/Library          | Purpose                                        | Recommendation                                                        |
|-----------------------|------------------------------------------------|-----------------------------------------------------------------------|
| **JavaScript**        | Primary development language                   | Already using JavaScript; continue with it.                           |
| **Replit**            | Cloud-based IDE for development                | Continue using Replit for coding and testing.                         |
| **Firebase**          | Backend-as-a-Service for real-time database    | Recommended for save/load functionality and storage.                  |
| **Git + GitHub**      | Version control and repository management      | Use Git for versioning and GitHub for collaboration.                  |
| **TypeScript**        | Static typing for better maintainability       | Optional but highly recommended for large projects.                   |
| **Vue.js or React**   | Framework for building dynamic UIs             | Optional, useful for modular UI development.                          |
| **Bootstrap or Tailwind CSS** | CSS framework for responsive UI          | Recommended to speed up UI design.                                    |
| **SASS/SCSS**         | CSS preprocessor for cleaner styles            | Optional, useful if CSS grows large and complex.                      |
| **Lodash.js**         | Utility library for data manipulation          | Optional, useful for simplifying array and object operations.         |

Summary Timeline
Phase    Description
Phase 1: Planning & Setup    Define game mechanics, set up project structure, and configure Firebase.
Phase 2: Farmland & Vineyard   Implement farmland acquisition, vineyard management, and basic UI.
Phase 3: Buildings & Resources   Develop the building system and implement resource management with storage limits.
Phase 4: Staff & Financials    Implement staff hiring, task management, payroll, and financial transactions.
Phase 5: Production System    Build grape crushing, fermentation, and wine aging mechanics with UI.
Phase 6: Save/Load System    Integrate Firebase for persistent data storage and implement save/load functionality.
Phase 7: UI Enhancements    Improve UI, add prestige mechanics, and polish task management.
Phase 8: Balancing & Testing    Playtest, balance game mechanics, fix bugs, and polish UI.
Phase 9: Final Deployment    Optimize the game for deployment and host it on a web platform.

### Complete File List
```
JavaScript Core (9,091 lines):
├── js/database/ (784 lines)
│   ├── firebase.js (19)
│   ├── loadSidebar.js (198)
│   └── adminFunctions.js (567)
├── js/overlays/mainpages/ (1,731 lines)
│   └── [10 files]
├── js/overlays/ (3,140 lines)
│   └── [15 files]
└── js/core/ (3,436 lines)
    └── [16 files]

CSS (2,517 lines):
├── buildings.css (316)
├── console.css (57)
├── finance.css (108)
├── overlay.css (677)
├── sidebar.css (398)
├── style.css (599)
├── taskbar.css (299)
└── variables.css (63)

HTML (714 lines):
├── consolePanel.html (3)
├── game.html (93)
├── index.html (119)
├── panel.html (25)
├── settings.html (73)
└── sidebar.html (67)