
# Winery Management Game

A web-based simulation game where players manage their own winery, from vineyard operations to wine production and sales.

## Project Statistics
- Total Files: 87 files (up from 61)
- Total Lines of Code: 18,450 (up from 12,322)
- Primary Language: JavaScript (14,219 lines)
- Secondary Languages: CSS (3,417 lines), HTML (814 lines)

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

### Enhanced Features
- **Team Management**: Create and manage specialized teams for different vineyard operations
- **Staff Search & Hiring System**: Advanced staff recruitment with skill levels and specializations
- **Upgrade System**: Research and implement vineyard improvements
- **Enhanced Building System**: Expanded building maintenance and tool management
- **Advanced Farmland Health**: Dynamic field health system affected by management decisions
- **Improved Financial Tools**: Enhanced bookkeeping and transaction tracking
- **Work Calculation System**: Detailed work calculation based on task complexity and staff skills
- **Tutorial System**: Interactive tutorials to guide new players

## Core Systems & Functions

### Staff Search & Hiring System (staffSearchOverlay.js - 286 lines)
- `showStaffSearchOverlay()`: Displays staff search interface with options
- `calculateSearchCost()`: Determines cost based on candidates, skill level, and specializations
- `staffSearch()`: Initiates the staff search process
- `specializationRoles`: Defines specialized roles like Vineyard Manager, Master Winemaker, etc.
- Search options including:
  - Number of candidates
  - Required skill level
  - Specialized role requirements

### Team Management System (teamManagementOverlay.js - 142 lines)
- Team creation and assignment
- Specialized role management
- Team performance tracking
- Team-based task allocation
- Auto-assignment to different task types

### Farmland System (farmland.js - 446 lines)
- `Farmland` class: Core class managing field properties and calculations
- `calculateLandvalue()`: Determines land value based on region, altitude, aspect
- `farmlandAgePrestigeModifier()`: Calculates prestige based on vine age
- `calculateFarmlandPrestige()`: Computes overall field prestige
- `farmlandYield()`: Calculates expected yield based on multiple factors
- `createFarmland()`: Generates new farmland with randomized or specified attributes

### Land Acquisition (buyLandOverlay.js - 140 lines)
- `showBuyLandOverlay()`: Displays available land for purchase
- Land value calculation based on:
  - Regional prestige rankings
  - Altitude benefits
  - Aspect ratings
  - Soil composition

### Harvesting System (harvestOverlay.js - 344 lines)
- `harvest()`: Manages grape collection and quality calculation
- Quality determined by:
  - Annual quality factor
  - Ripeness level
  - Field prestige
  - Farmland health
- Integrates with storage system for harvest collection

### Work Calculation System (utils/workCalculator.js)
- `calculateTotalWork()`: Computes work required for tasks based on multiple factors
- Factors affecting work:
  - Task type and rate
  - Staff skill level
  - Specialized roles
  - Environmental conditions (altitude, terrain)
  - Resource characteristics (fragility)

### Buildings System (buildings.js - 312 lines)
- `buildBuilding()`: Creates new buildings
- `upgradeBuilding()`: Handles building upgrades
- `updateBuildingCards()`: Updates UI for buildings
- `getBuildingTools()`: Retrieves available tools for buildings
- `createTool()`: Instantiates new building tools

### Resource Management (resource.js - 247 lines)
- `Resource` class: Defines grape varieties and properties
- `InventoryItem`: Tracks item state, vintage, quality
- Inventory management with storage locations
- Quality tracking across wine production stages

### Staff Management (staff.js - 236 lines)
- `hireStaff()`: Handles staff recruitment
- `updateStaffWages()`: Manages salary payments
- `assignStaffToTask()`: Task management
- `setupStaffWagesRecurringTransaction()`: Sets up payroll
- `updateWagesAndRecurringTransaction()`: Updates staff payments
- Staff creation with nationality and skills
- Specialized role system with skill bonuses
- Team management with default templates
- Automatic wage calculation and payroll
- Skill levels: Fresh Off the Vine to Living Legend

### Financial System (finance.js - 185 lines, upgrade.js - 176 lines)
- `addTransaction()`: Records financial transactions
- `updateCashflow()`: Manages money flow
- `calculateBalance()`: Computes current balance
- `processRecurringTransactions()`: Handles regular payments
- Transaction and cash flow tracking
- Income statements and balance sheets
- Asset valuation (buildings, land, inventory)
- Upgrades system for farmland improvements
- Recurring transaction management

### Production System
#### Crushing Process (crushingOverlay.js - 336 lines)
- `showCrushingOverlay()`: Displays crushing interface
- `handleCrushing()`: Processes grape crushing
- `updateMustStorage()`: Manages must storage
- `calculateMustQuality()`: Determines must quality

#### Wine Processing (wineprocessing.js - 53 lines)
- `fermentMust()`: Manages fermentation process
- `agingProcess()`: Handles wine aging
- `calculateWineQuality()`: Determines final wine quality

### Tutorial System (tutorial.js)
- Interactive guides for new players
- Step-by-step instructions for game mechanics
- Context-sensitive help for different game areas

### Database Layer
#### Admin Functions (adminFunctions.js - 567 lines)
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
#### Component System (components/*.js)
- Reusable UI components for consistent interface
- `createWorkCalculationTable()`: Generates work requirement displays
- `createOverlayHTML()`: Standardized overlay creation
- `createSlider()`: Interactive range sliders with labels
- `createInfoBox()`: Information display components

#### Sidebar System (loadSidebar.js - 198 lines)
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
- When sidebar is toggle collapsed from localStorage, mainwindow doesn't get 'collapsed width'
- Company info tooltip in collapsed sidebar doesn't work properly
- Load/save errors on crushing tasks

## Planned Improvements
- Enhanced planting mechanics with vine age system
- Improved vineyard cycle (harvest, pruning, trimming)
- Better task management UI
- Enhanced wine order grouping and filtering
- Improved building maintenance information display
- Field health management system
- Better error messages for harvesting/crushing/fermenting operations

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

### Project Structure
```
├── js/
│   ├── database/ (784 lines)
│   │   ├── firebase.js (19)
│   │   ├── loadSidebar.js (198)
│   │   ├── adminFunctions.js (567)
│   │   └── initiation.js (NEW)
│   ├── overlays/mainpages/ (1,731 lines)
│   │   ├── adminoverlay.js
│   │   ├── buildingsoverlay.js
│   │   ├── financeoverlay.js
│   │   ├── inventoryoverlay.js
│   │   ├── landoverlay.js
│   │   ├── mainofficeoverlay.js
│   │   ├── salesoverlay.js
│   │   ├── staffoverlay.js
│   │   ├── vineyardoverlay.js
│   │   └── wineryoverlay.js
│   ├── overlays/ (3,426 lines)
│   │   ├── assignStaffOverlay.js
│   │   ├── buildingOverlay.js
│   │   ├── buyLandOverlay.js
│   │   ├── clearingOverlay.js
│   │   ├── crushingOverlay.js
│   │   ├── farmlandOverlay.js
│   │   ├── fermentationOverlay.js
│   │   ├── harvestOverlay.js
│   │   ├── hireStaffOptionsOverlay.js
│   │   ├── hirestaffoverlay.js
│   │   ├── overlayUtils.js
│   │   ├── plantingOverlay.js
│   │   ├── resourceInfoOverlay.js
│   │   ├── showstaffoverlay.js
│   │   ├── staffSearchOverlay.js (NEW)
│   │   ├── startingConditionOverlay.js
│   │   ├── teamManagementOverlay.js
│   │   └── uprootOverlay.js
│   ├── components/ (NEW)
│   │   ├── createOverlayHTML.js
│   │   ├── workCalculationTable.js
│   │   └── other UI components
│   ├── utils/ (NEW)
│   │   ├── workCalculator.js
│   │   └── other utility functions
│   ├── constants/ (NEW)
│   │   └── constants.js
│   └── core/ (7,278 lines)
│       ├── administration.js
│       ├── buildings.js
│       ├── company.js
│       ├── console.js
│       ├── displayManager.js
│       ├── endDay.js
│       ├── farmland.js
│       ├── finance.js
│       ├── names.js
│       ├── resource.js
│       ├── sales.js
│       ├── serviceWorker.js
│       ├── settings.js
│       ├── staff.js
│       ├── taskManager.js
│       ├── tutorial.js (NEW)
│       ├── upgrade.js
│       ├── utils.js
│       ├── vineyard.js
│       └── wineprocessing.js

CSS (3,417 lines):
├── buildings.css
├── components.css (NEW)
├── console.css
├── dataoverlays.css (NEW)
├── finance.css
├── healthbar.css (NEW)
├── overlay.css
├── sidebar.css
├── style.css
├── taskbar.css
├── tutorial.css (NEW)
├── utility.css (NEW)
├── variables.css
└── wineprocessing.css (NEW)

HTML (814 lines):
├── consolePanel.html
├── game.html
├── index.html
├── panel.html
├── settings.html (NEW)
└── sidebar.html
```
