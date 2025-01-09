import { getBuildingTools, createTool, Building } from '../buildings.js';
import { addConsoleMessage } from '/js/console.js';
//import { updateBuildingCards } from '/js/buildings.js'; // Make sure the import path is correct
import { storeBuildings, loadBuildings } from '/js/database/adminFunctions.js';
import { addTransaction } from '../finance.js'; // Ensure this import is at the top of your file.


function createBuildingDetails(building) {
  const tools = getBuildingTools().filter(tool => tool.buildingType === building.name);

  const toolButtons = tools.map(tool => `
    <button class="add-tool-button" data-tool-name="${tool.name}">Add ${tool.name}</button>
  `).join('');

  return `
    <h2>${building.name}</h2>
    <p>Capacity: ${building.capacity}</p>
    <p>Contents: ${building.listContents ? building.listContents() : "No tools stored."}</p>
    ${toolButtons}
    <div class="building-simulator">
      <div id="capacity-grid" class="capacity-grid"></div>
    </div>
  `;
}

function setupToolButtons(building, tools) {
  // Make sure we have a proper Building instance with existing tools
  let buildingInstance;
  if (building instanceof Building) {
    buildingInstance = building;
  } else {
    buildingInstance = new Building(building.name, building.level);
    // Copy existing tools if any
    if (building.tools && Array.isArray(building.tools)) {
      buildingInstance.tools = [...building.tools];
    }
  }
  tools.forEach(tool => {
    const button = document.querySelector(`.add-tool-button[data-tool-name="${tool.name}"]`);
    if (button) {
      button.addEventListener('click', () => {
        const newToolInstance = createTool(tool.name); // Create a new instance of the tool
        if (newToolInstance && buildingInstance.addTool(newToolInstance)) { 
          // Notify addition of the tool
          addConsoleMessage(`${newToolInstance.name} #${newToolInstance.instanceNumber} added to ${building.name}.`);

          // Deduct the cost of the tool
          const expenseMessage = `Purchased ${newToolInstance.name} #${newToolInstance.instanceNumber} for €${newToolInstance.cost}`;
          addTransaction('Expense', expenseMessage, -newToolInstance.cost);

          // Notify expense
          addConsoleMessage(expenseMessage);

          // Load current buildings list, update the relevant building, and store the updated list
          const buildings = loadBuildings();
          const buildingToUpdate = buildings.find(b => b.name === building.name);
          if (buildingToUpdate) {
            buildingToUpdate.tools = buildingInstance.tools; // Copy the tools array from our instance
            const updatedBuildings = buildings.map(b => b.name === building.name ? buildingToUpdate : b);
            storeBuildings(updatedBuildings);
          }

          // Refresh the capacity visual and reload the overlay with updated building data
          const updatedBuildings = loadBuildings();
          const updatedBuilding = updatedBuildings.find(b => b.name === building.name);
          if (updatedBuilding) {
            const buildingInstance = new Building(updatedBuilding.name, updatedBuilding.level);
            buildingInstance.tools = updatedBuilding.tools;
            showBuildingOverlay(buildingInstance);
            // Update building cards to reflect new tool
            updateBuildingCards();
          }
        } else {
          addConsoleMessage(`Cannot add ${tool.name}. ${building.name} is full!`);
        }
      });
    }
  });
}

// Updated showBuildingOverlay function
export function showBuildingOverlay(building) {
  const overlay = document.getElementById('buildingOverlay');
  const details = document.getElementById('building-details');

  if (details && overlay) {
    details.innerHTML = createBuildingDetails(building);

    // Call the function to render capacity visual
    renderCapacityVisual(building);

    const tools = getBuildingTools().filter(tool => tool.buildingType === building.name);
    setupToolButtons(building, tools);

    overlay.style.display = 'flex';
  }
}

// Function to render the visual representation of capacity
function renderCapacityVisual(building) {
  const capacityGrid = document.getElementById('capacity-grid');
  if (!capacityGrid) return;

  const totalCapacity = building.capacity;
  const usedCapacity = building.tools ? building.tools.length : 0;

  // Clear existing grid
  capacityGrid.innerHTML = '';

  // Create grid squares
  for (let i = 0; i < totalCapacity; i++) {
    const cell = document.createElement('div');
    cell.className = 'capacity-cell';

    if (i < usedCapacity) {
      const tool = building.tools[i];
      const iconPath = `/assets/icon/buildings/${tool.name.toLowerCase()}.png`; // Path for the icon
      cell.innerHTML = `
        <img src="${iconPath}" alt="${tool.name}" style="width: 24px; height: 24px;" />
      `;
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