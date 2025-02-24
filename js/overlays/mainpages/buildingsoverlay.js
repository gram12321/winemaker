// Import required functions from other modules
import { loadBuildings } from '/js/database/adminFunctions.js';
import { buildBuilding, upgradeBuilding } from '/js/buildings.js';
import { updateAllDisplays } from '/js/displayManager.js';
import { showBuildingOverlay } from '/js/overlays/buildingOverlay.js';
import { showMainViewOverlay } from '/js/overlays/overlayUtils.js';
import { Building } from '/js/classes/buildingClasses.js';  // Add this import
import taskManager from '/js/taskManager.js';  // Add this import

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

              <div class="col-md-6">
                <div class="building-card">
                  <div class="icon" style="background-image: url('/assets/icon/menu/office.webp');"></div>
                  <div class="details building-details" data-building-name="Office"></div>
                </div>
                <button class="btn btn-light btn-sm build-button overlay-section-btn" data-building-name="Office">Build</button>
                <button class="btn btn-light btn-sm upgrade-button overlay-section-btn" data-building-name="Office" disabled>Upgrade</button>
              </div>

              <div class="col-md-6">
                <div class="building-card">
                  <div class="icon" style="background-image: url('/assets/icon/menu/winecellar.webp');"></div>
                  <div class="details building-details" data-building-name="Wine Cellar"></div>
                </div>
                <button class="btn btn-light btn-sm build-button overlay-section-btn" data-building-name="Wine Cellar">Build</button>
                <button class="btn btn-light btn-sm upgrade-button overlay-section-btn" data-building-name="Wine Cellar" disabled>Upgrade</button>
              </div>

              <div class="col-md-6">
                <div class="building-card">
                  <div class="icon" style="background-image: url('/assets/icon/menu/winery.webp');"></div>
                  <div class="details building-details" data-building-name="Winery"></div>
                </div>
                <button class="btn btn-light btn-sm build-button overlay-section-btn" data-building-name="Winery">Build</button>
                <button class="btn btn-light btn-sm upgrade-button overlay-section-btn" data-building-name="Winery" disabled>Upgrade</button>
              </div>
            </div>
        </div>
    `;
}

export function updateBuildButtonStates() { // Disable build and upgrade buttons if not allowed (No money or already built)
  const buildings = loadBuildings();
  const currentMoney = parseInt(localStorage.getItem('money')) || 0;
  const activeTasks = taskManager.getAllTasks();

  const buildButtons = document.querySelectorAll('.build-button');
  const upgradeButtons = document.querySelectorAll('.upgrade-button');

  buildButtons.forEach((button, index) => {
    const buildingName = button.getAttribute('data-building-name');
    const upgradeButton = upgradeButtons[index];
    const existingBuilding = buildings.find(b => b.name === buildingName);
    const buildCost = Building.BUILDINGS[buildingName]?.baseCost || 500000;
    const hasBuildingTask = activeTasks.some(task => 
      task.name === 'Building & Maintenance' && 
      task.params.buildingName === buildingName
    );

    if (existingBuilding) {
      button.disabled = true;
      button.textContent = "Built";

      const building = new Building(buildingName, existingBuilding.level);
      const upgradeCost = building.getUpgradeCost();
      upgradeButton.disabled = currentMoney < upgradeCost;
    } else if (hasBuildingTask) {
      button.disabled = true;
      button.textContent = "Building...";
    } else {
      button.disabled = currentMoney < buildCost;
      button.textContent = "Build";
    }
  });
}

export function updateBuildingCards() {
  const buildings = loadBuildings();

  document.querySelectorAll('.building-card').forEach(cardDiv => {
    const detailDiv = cardDiv.querySelector('.building-details');
    if (!detailDiv) return;

    const buildingName = detailDiv.getAttribute('data-building-name');
    if (!buildingName) return;

    const buildingData = buildings.find(b => b.name === buildingName);
    const isBuilt = buildingData !== undefined;

    // Create proper Building instance if building exists
    const building = isBuilt ? new Building(buildingData.name, buildingData.level) : null;
    if (building && buildingData.slots) {
      building.slots = buildingData.slots;
    }

    cardDiv.classList.toggle('unbuilt-card', !isBuilt);

    detailDiv.innerHTML = `
      <p><strong>${buildingName}</strong></p>
      <p>Status: ${isBuilt ? "Operational" : "Unbuilt"}</p>
      <p>Level: ${isBuilt ? building.level : 0}</p>
      <p>Upgrade Cost: ${isBuilt ? `€${building.getUpgradeCost()}` : "N/A"}</p>
      <p>Capacity: ${isBuilt ? building.capacity : 0}</p>
      <p>Content: <br> ${isBuilt ? building.listContents() : "No tools stored."}</p>
    `;

    if (isBuilt) {
      cardDiv.onclick = () => showBuildingOverlay(building);
    } else {
      cardDiv.onclick = null;
    }
  });
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
    buildButtons.forEach(button => {
        const buildingName = button.getAttribute('data-building-name');
        button.addEventListener('click', () => {
            buildBuilding(buildingName);
        });
    });

    // Setup upgrade buttons
    const upgradeButtons = overlay.querySelectorAll('.upgrade-button');
    upgradeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const buildingName = button.getAttribute('data-building-name');
            upgradeBuilding(buildingName);
        });
    });

    updateAllDisplays();
}
