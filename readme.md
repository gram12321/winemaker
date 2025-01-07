
# Winery Management Game

A web-based simulation game where players manage their own winery, from vineyard operations to wine production and sales.

## Project Statistics
- Total Files: 41
- Total Lines of Code: 4,897
- Primary Language: JavaScript
- Secondary Languages: HTML, CSS

## Features

- **Vineyard Management**: Plant, maintain, and harvest various grape varieties
- **Production Facilities**: Build and upgrade buildings like Tool Sheds and Warehouses
- **Staff Management**: Hire and manage vineyard workers, cellar masters, and other staff
- **Wine Production**: Control the wine-making process from crushing to fermentation
- **Financial System**: Manage expenses, sales, and track company prestige
- **Resource Management**: Handle inventory, storage, and wine aging

## Project Structure & Functions

### Core System Files
- **buildings.js** (312 lines)
  - `buildBuilding()`: Creates new buildings
  - `upgradeBuilding()`: Handles building upgrades
  - `updateBuildingCards()`: Updates UI for buildings

- **resource.js** (247 lines)
  - `Resource` class: Base class for game resources
  - `sellWines()`: Handles wine sales
  - `populateStorageTable()`: Updates storage UI

- **staff.js** (236 lines)
  - `hireStaff()`: Handles staff recruitment
  - `updateStaffWages()`: Manages salary payments
  - `assignStaffToTask()`: Task management

### Database Layer
- **adminFunctions.js** (394 lines)
  - `saveCompanyInfo()`: Persists company data
  - `loadBuildings()`: Retrieves building data
  - `clearLocalStorage()`: Resets game state

- **loadSidebar.js** (243 lines)
  - `initializeSidebar()`: Sets up game sidebar
  - `calculateCompanyPrestige()`: Computes prestige score

### Complete File List
```
JavaScript Core:
19 ./js/database/firebase.js
394 ./js/database/adminFunctions.js
243 ./js/database/loadSidebar.js
446 ./js/names.js
312 ./js/buildings.js
247 ./js/resource.js
236 ./js/staff.js
212 ./js/farmland.js
210 ./js/sales.js
156 ./js/endDay.js
132 ./js/finance.js
109 ./js/utils.js
97 ./js/loadPanel.js
89 ./js/administration.js
78 ./js/console.js
75 ./js/settings.js
72 ./js/vineyard.js

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
```

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
