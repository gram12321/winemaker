import { getBuildingTools, createTool, Building } from '../buildings.js';
import { addConsoleMessage } from '/js/console.js';
import { updateBuildingCards } from '/js/buildings.js'; // Make sure the import path is correct
import { storeBuildings, loadBuildings } from '/js/database/adminFunctions.js';
import { addTransaction } from '../finance.js'; // Ensure this import is at the top of your file.
import { formatNumber } from '../utils.js';


function createBuildingDetails(building) {
  const tools = getBuildingTools().filter(tool => tool.buildingType === building.name);

  const toolButtons = `<div class="tool-grid">` + tools.map(tool => `
    <div class="tool-container">
      <div class="tool-header">
        <button class="add-tool-button btn btn-light btn-sm overlay-section-btn" data-tool-name="${tool.name}">Add ${tool.name}</button>
        <button class="toggle-stats-btn btn btn-sm" type="button">
          <span class="chevron">▼</span>
        </button>
      </div>
      <div class="tool-stats small">
        <div>Cost: €${formatNumber(tool.cost)}</div>
        ${tool.speedBonus !== 1.0 ? `<div>Speed Bonus: ${(tool.speedBonus * 100 - 100).toFixed(0)}%</div>` : ''}
        ${tool.capacity > 0 ? `<div>Storage: ${formatNumber(tool.capacity)} kg</div>` : ''}
        ${tool.supportedResources?.length ? `<div>Stores: ${tool.supportedResources.join(', ')}</div>` : ''}
      </div>
    </div>
  `).join('') + `</div>`;

  return `
    <div class="card">
      <div class="card-header text-white d-flex justify-content-between align-items-center">
        <h3 class="h5 mb-0">${building.name}</h3>
        <button id="closeBuildingOverlay" class="btn btn-light btn-sm overlay-section-btn">Close</button>
      </div>
      <div class="card-body">
        <div class="button-container">
          ${toolButtons}
        </div>
        <div class="building-simulator mt-3">
          <div id="capacity-grid" class="capacity-grid"></div>
        </div>
      </div>
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
          // Add the enhanced message and record transaction
          const expenseMessage = `${newToolInstance.name} #${newToolInstance.instanceNumber} added to ${building.name}. <span style="color: red">Cost: €${formatNumber(newToolInstance.cost)}</span>. Remaining Capacity: ${building.capacity - buildingInstance.tools.length} spaces`;
          addConsoleMessage(expenseMessage);
          addTransaction('Expense', `Purchased ${newToolInstance.name} #${newToolInstance.instanceNumber}`, -newToolInstance.cost);

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
    setupCloseListeners(overlay);
    setupStatsToggles();
    
    overlay.style.display = 'flex';
}

function setupStatsToggles() {
  document.querySelectorAll('.toggle-stats-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const statsDiv = e.target.closest('.tool-container').querySelector('.tool-stats');
      statsDiv.classList.toggle('collapsed');
      const isExpanded = !statsDiv.classList.contains('collapsed');
      btn.setAttribute('aria-expanded', isExpanded);
    });
  });
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
    overlay.style.display = 'none';
    updateBuildingCards();
  }
}

function setupCloseListeners(overlay) {
  const closeButton = document.getElementById('closeBuildingOverlay');
  if (closeButton) {
    closeButton.addEventListener('click', hideBuildingOverlay);
  }

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      hideBuildingOverlay();
    }
  });
}