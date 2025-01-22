
// Import required functions from other modules
import { loadBuildings } from '/js/database/adminFunctions.js';
import { buildBuilding, upgradeBuilding, updateBuildingCards } from '/js/buildings.js';
import { showBuildingOverlay } from '/js/overlays/buildingOverlay.js';
import { showMainViewOverlay } from '/js/overlays/overlayUtils.js';

export function showBuildingsOverlay() {
    const buildings = loadBuildings();
    const overlay = showMainViewOverlay(`
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
    `);

    // Add event listeners for building and upgrading buttons
    initButtonListeners();
    
    // Add click handlers for building cards
    const buildingCards = document.querySelectorAll('.building-card');
    buildingCards.forEach(card => {
      card.addEventListener('click', () => {
        const buildingName = card.querySelector('.building-details').getAttribute('data-building-name');
        const buildings = loadBuildings();
        const building = buildings.find(b => b.name === buildingName);
        if (building) {
          showBuildingOverlay(building);
        }
      });
    });
}

// Function to initialize event listeners for build and upgrade buttons
function initButtonListeners() {
  const buildings = loadBuildings();
  const buildButtons = document.querySelectorAll('.build-button');
  const upgradeButtons = document.querySelectorAll('.upgrade-button');

  buildButtons.forEach((button, index) => {
    const buildingName = button.getAttribute('data-building-name');
    const upgradeButton = upgradeButtons[index];
    const existingBuilding = buildings.find(b => b.name === buildingName);

    if (existingBuilding) {
      button.disabled = true;
      button.textContent = "Built";
      upgradeButton.disabled = false;
    } else {
      button.disabled = false;
      button.addEventListener('click', () => {
        buildBuilding(buildingName);
      });
    }
  });

  upgradeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const buildingName = button.getAttribute('data-building-name');
      upgradeBuilding(buildingName);
    });
  });

  updateBuildingCards();
}
