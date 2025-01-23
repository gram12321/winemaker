
// Import required functions from other modules
import { loadBuildings } from '/js/database/adminFunctions.js';
import { buildBuilding, upgradeBuilding, updateBuildingCards } from '/js/buildings.js';
import { showBuildingOverlay } from '/js/overlays/buildingOverlay.js';
import { showMainViewOverlay } from '/js/overlays/overlayUtils.js';

export function showBuildingsOverlay() {
    const overlay = showMainViewOverlay(createBuildingsOverlayHTML());
    setupBuildingsEventListeners(overlay);
}

function createBuildingsOverlayHTML() {
    return `
        <div class="mainview-overlay-content">
            <h3>Buildings</h3>
            <div class="row">
              <div class="col-md-6">
                <div class="building-card">
                  <div class="icon" style="background-image: url('/assets/icon/menu/toolshed.webp');"></div>
                  <div class="details building-details" data-building-name="Tool Shed"></div>
                </div>
                <button class="btn btn-light btn-sm build-button overlay-section-btn" data-building-name="Tool Shed">Build</button>
                <button class="btn btn-light btn-sm upgrade-button overlay-section-btn" data-building-name="Tool Shed" disabled>Upgrade</button>
              </div>

              <div class="col-md-6">
                <div class="building-card">
                  <div class="icon" style="background-image: url('/assets/icon/menu/warehouse.webp');"></div>
                  <div class="details building-details" data-building-name="Warehouse"></div>
                </div>
                <button class="btn btn-light btn-sm build-button overlay-section-btn" data-building-name="Warehouse">Build</button>
                <button class="btn btn-light btn-sm upgrade-button overlay-section-btn" data-building-name="Warehouse" disabled>Upgrade</button>
              </div>
            </div>
        </div>
    `;
}

function setupBuildingsEventListeners(overlay) {
    const buildings = loadBuildings();
    
    // Setup building cards click handlers
    const buildingCards = overlay.querySelectorAll('.building-card');
    buildingCards.forEach(card => {
        card.addEventListener('click', () => {
            const buildingName = card.querySelector('.building-details').getAttribute('data-building-name');
            const building = buildings.find(b => b.name === buildingName);
            if (building) {
                showBuildingOverlay(building);
            }
        });
    });

    // Setup build buttons
    const buildButtons = overlay.querySelectorAll('.build-button');
    const upgradeButtons = overlay.querySelectorAll('.upgrade-button');
    const currentMoney = parseInt(localStorage.getItem('money')) || 0;

    buildButtons.forEach((button, index) => {
        const buildingName = button.getAttribute('data-building-name');
        const upgradeButton = upgradeButtons[index];
        const existingBuilding = buildings.find(b => b.name === buildingName);
        const buildCost = Building.BASE_COSTS[buildingName] || 500000;

        if (existingBuilding) {
            button.disabled = true;
            button.textContent = "Built";
            
            // Check money for upgrade
            const building = new Building(buildingName, existingBuilding.level);
            const upgradeCost = building.getUpgradeCost();
            upgradeButton.disabled = currentMoney < upgradeCost;
        } else {
            button.disabled = currentMoney < buildCost;
            button.addEventListener('click', () => {
                buildBuilding(buildingName);
            });
        }
    });

    // Setup upgrade buttons
    upgradeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const buildingName = button.getAttribute('data-building-name');
            upgradeBuilding(buildingName);
        });
    });

    updateBuildingCards();
}
