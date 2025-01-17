# Winery Management Game

A web-based simulation game where players manage their own winery, from vineyard operations to wine production and sales.

## Project Statistics
- Total Files: 47
- Total Lines of Code: 8041 #Updated line count
- Primary Language: JavaScript
- Secondary Languages: HTML, CSS

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
- Save/load functionality for owned land and staff needs improvement
- Multiple building/maintenance tasks can be created for same building
- Building name display issues in task boxes
- Winery tasks don't properly update UI without page refresh
- Save/load functionality issues with owned land and staff
- Building name only shows in taskbox after page reload
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
JavaScript Core:
19 ./js/database/firebase.js
482 ./js/database/adminFunctions.js
187 ./js/database/loadSidebar.js
447 ./js/names.js
251 ./js/buildings.js
119 ./js/resource.js
230 ./js/staff.js
242 ./js/farmland.js
176 ./js/sales.js
158 ./js/endDay.js
185 ./js/finance.js
245 ./js/taskManager.js
124 ./js/utils.js
11 ./js/loadPanel.js
86 ./js/administration.js
80 ./js/console.js
75 ./js/settings.js
68 ./js/vineyard.js
53 ./js/wineprocessing.js

Overlays:
167 ./js/overlays/crushingOverlay.js
144 ./js/overlays/harvestOverlay.js
142 ./js/overlays/plantingOverlay.js
135 ./js/overlays/buyLandOverlay.js
112 ./js/overlays/buildingOverlay.js
102 ./js/overlays/hirestaffoverlay.js
97 ./js/overlays/mainpages/buildingsoverlay.js
96 ./js/overlays/mainpages/vineyardoverlay.js
89 ./js/overlays/mainpages/wineryoverlay.js
87 ./js/overlays/mainpages/inventoryoverlay.js
74 ./js/overlays/mainpages/landoverlay.js
69 ./js/overlays/farmlandOverlay.js
67 ./js/overlays/selectContainerOverlay.js
64 ./js/overlays/mainpages/financeoverlay.js
54 ./js/overlays/mainpages/staffoverlay.js
38 ./js/overlays/mainpages/adminoverlay.js
7 ./js/overlays/mainpages/hideOverlays.js
93 ./js/overlays/mainpages/financeoverlay.js
202 ./js/overlays/mainpages/inventoryoverlay.js
137 ./js/overlays/mainpages/wineryoverlay.js
97 ./js/overlays/mainpages/buildingsoverlay.js
60 ./js/overlays/mainpages/landoverlay.js
276 ./js/overlays/mainpages/salesoverlay.js
58 ./js/overlays/mainpages/staffoverlay.js
113 ./js/overlays/mainpages/vineyardoverlay.js
67 ./js/overlays/selectContainerOverlay.js
107 ./js/overlays/fermentationOverlay.js
75 ./js/overlays/showstaffoverlay.js
336 ./js/overlays/crushingOverlay.js
93 ./js/overlays/assignStaffOverlay.js
203 ./js/overlays/buildingOverlay.js
140 ./js/overlays/buyLandOverlay.js
90 ./js/overlays/farmlandOverlay.js
344 ./js/overlays/harvestOverlay.js
140 ./js/overlays/hirestaffoverlay.js
190 ./js/overlays/plantingOverlay.js


HTML:
107 ./html/game.html
73 ./html/settings.html
30 ./html/sidebar.html
10 ./html/panel.html
3 ./html/consolePanel.html
34 ./index.html

CSS:
257 ./css/overlay.css
167 ./css/taskbar.css
129 ./css/sidebar.css
78 ./css/style.css
73 ./css/buildings.css
46 ./css/finance.css
42 ./css/console.css
108 ./css/finance.css
47 ./css/variables.css
42 ./css/console.css
303 ./css/buildings.css
550 ./css/overlay.css
188 ./css/sidebar.css
193 ./css/style.css
189 ./css/taskbar.css