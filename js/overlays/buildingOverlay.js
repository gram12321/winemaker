
import { getBuildingTools } from '../buildings.js';
import { addConsoleMessage } from '/js/console.js';
import { updateBuildingCards } from '/js/buildings.js'; // Make sure the import path is correct
import { storeBuildings, loadBuildings } from '/js/database/adminFunctions.js';


// Updated showBuildingOverlay function in js/overlays/buildingOverlay.js

export function showBuildingOverlay(building) {
  const overlay = document.getElementById('buildingOverlay');
  const details = document.getElementById('building-details');

  if (details && overlay) {
    const tools = getBuildingTools().filter(tool => tool.buildingType === building.name);

    const toolButtons = tools.map(tool => `
      <button class="add-tool-button" data-tool-name="${tool.name}">Add ${tool.name}</button>
    `).join('');

    const buildingDetails = `
      <h2>${building.name}</h2>
      <p>Capacity: ${building.capacity}</p>
      <p>Contents: ${building.listContents()}</p>
      ${toolButtons}
      <div class="building-simulator">
        <div id="capacity-grid" class="capacity-grid"></div>
      </div>
    `;

    details.innerHTML = buildingDetails;

    // Call the function to render capacity visual
    renderCapacityVisual(building);

    tools.forEach(tool => {
      const button = document.querySelector(`.add-tool-button[data-tool-name="${tool.name}"]`);
      if (button) {
        button.addEventListener('click', () => {
          if (building.addContent(tool)) {
            addConsoleMessage(`${tool.name} added to ${building.name}.`);

            // Load current buildings list, update the relevant building, and store the updated list
            const buildings = loadBuildings();
            const updatedBuildings = buildings.map(b => b.name === building.name ? building : b);
            storeBuildings(updatedBuildings);

            // Refresh the capacity visual
            renderCapacityVisual(building);

            showBuildingOverlay(building);
          } else {
            addConsoleMessage(`Cannot add ${tool.name}. ${building.name} is full!`);
          }
        });
      }
    });

    overlay.style.display = 'flex';
  }
}

// Function to render the visual representation of capacity
function renderCapacityVisual(building) {
  const capacityGrid = document.getElementById('capacity-grid');
  if (!capacityGrid) return;

  const totalCapacity = building.capacity;
  const usedCapacity = building.contents.length; // Assuming contents is an array

  // Clear existing grid
  capacityGrid.innerHTML = '';

  // Create grid squares
  for (let i = 0; i < totalCapacity; i++) {
    const cell = document.createElement('div');
    cell.className = 'capacity-cell';
    if (i < usedCapacity) {
      cell.classList.add('filled'); // Add class if this capacity is used
    }
    capacityGrid.appendChild(cell);
  }
}


export function hideBuildingOverlay() {
  const overlay = document.getElementById('buildingOverlay');
  if (overlay) {
    overlay.style.display = 'none'; // Hide the overlay

    // Update building cards when overlay is closed
    updateBuildingCards();
  }
}