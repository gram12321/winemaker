// Import required functions from other modules
import { loadBuildings } from '/js/database/adminFunctions.js';
import { buildBuilding, upgradeBuilding, updateBuildingCards } from '/js/buildings.js';

// Function to create and display the buildings overlay
export function showBuildingsOverlay() {
    // Remove any existing instances of the overlay
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create the overlay element
    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    // Create content for the overlay
    overlay.innerHTML = `
        <div class="mainview-overlay-content">
            <h3>Buildings</h3>
            <div class="row">
              <div class="col-md-6">
                <div class="building-card">
                  <div class="icon" style="background-image: url('/assets/icon/menu/toolshed.webp');"></div>
                  <div class="details building-details" data-building-name="Tool Shed"></div>
                </div>
                <button class="btn btn-success build-button" data-building-name="Tool Shed">Build</button>
                <button class="btn btn-secondary upgrade-button" data-building-name="Tool Shed" disabled>Upgrade</button>
              </div>

              <div class="col-md-6">
                <div class="building-card">
                  <div class="icon" style="background-image: url('/assets/icon/menu/warehouse.webp');"></div>
                  <div class="details building-details" data-building-name="Warehouse"></div>
                </div>
                <button class="btn btn-success build-button" data-building-name="Warehouse">Build</button>
                <button class="btn btn-secondary upgrade-button" data-building-name="Warehouse" disabled>Upgrade</button>
              </div>
            </div>
        </div>
    `;

    // Append overlay to the document body
    document.body.appendChild(overlay);

    // Display the overlay
    overlay.style.display = 'block';

    // Add event listeners for building and upgrading buttons
    initButtonListeners();
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