import { getBuildingTools, createTool, Building } from '../buildings.js';
import { addConsoleMessage } from '/js/console.js';
import { updateBuildingCards } from '/js/buildings.js';
import { storeBuildings, loadBuildings } from '/js/database/adminFunctions.js';
import { addTransaction } from '../finance.js';
import { formatNumber } from '../utils.js';


function createBuildingDetails(building) {
  const tools = getBuildingTools().filter(tool => tool.buildingType === building.name);

  const toolButtons = tools.map(tool => `
    <button class="add-tool-button btn btn-primary btn-sm" data-tool-name="${tool.name}">Add ${tool.name}</button>
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
  let buildingInstance;
  if (building instanceof Building) {
    buildingInstance = building;
  } else {
    buildingInstance = new Building(building.name, building.level);
    if (building.tools && Array.isArray(building.tools)) {
      buildingInstance.tools = [...building.tools];
    }
  }
  tools.forEach(tool => {
    const button = document.querySelector(`.add-tool-button[data-tool-name="${tool.name}"]`);
    if (button) {
      button.addEventListener('click', () => {
        const newToolInstance = createTool(tool.name);
        if (newToolInstance && buildingInstance.addTool(newToolInstance)) {
          const expenseMessage = `${newToolInstance.name} #${newToolInstance.instanceNumber} added to ${building.name}. <span style="color: red">Cost: €${formatNumber(newToolInstance.cost)}</span>. Remaining Capacity: ${building.capacity - buildingInstance.tools.length} spaces`;
          addConsoleMessage(expenseMessage);
          addTransaction('Expense', `Purchased ${newToolInstance.name} #${newToolInstance.instanceNumber}`, -newToolInstance.cost);
          addConsoleMessage(expenseMessage);
          const buildings = loadBuildings();
          const buildingToUpdate = buildings.find(b => b.name === building.name);
          if (buildingToUpdate) {
            buildingToUpdate.tools = buildingInstance.tools;
            const updatedBuildings = buildings.map(b => b.name === building.name ? buildingToUpdate : b);
            storeBuildings(updatedBuildings);
          }
          const updatedBuildings = loadBuildings();
          const updatedBuilding = updatedBuildings.find(b => b.name === building.name);
          if (updatedBuilding) {
            const buildingInstance = new Building(updatedBuilding.name, updatedBuilding.level);
            buildingInstance.tools = updatedBuilding.tools;
            showBuildingOverlay(buildingInstance);
            updateBuildingCards();
          }
        } else {
          addConsoleMessage(`Cannot add ${tool.name}. ${building.name} is full!`);
        }
      });
    }
  });
}

export function showBuildingOverlay(building) {
  const overlay = document.getElementById('buildingOverlay');
  const overlayContent = document.getElementById('building-details');
  const toolsHTML = building.tools.map(tool => `<p>${tool.name}</p>`).join(''); // Example toolsHTML generation

  if (overlayContent && overlay) {
    overlayContent.innerHTML = `
      <div class="overlay-content overlay-container">
        <section class="overlay-section card mb-4">
          <div class="card-header text-white d-flex justify-content-between align-items-center">
            <h3 class="h5 mb-0">${building.name}</h3>
            <button class="btn btn-light btn-sm overlay-section-btn" id="close-building-overlay">Close</button>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <div class="card mb-3">
                  <div class="card-body">
                    <h5 class="card-title">Building Status</h5>
                    <p class="card-text">Level: ${building.level}</p>
                    <p class="card-text">Storage: ${building.currentStorage}/${building.maxStorage}</p>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card mb-3">
                  <div class="card-body">
                    <h5 class="card-title">Available Tools</h5>
                    <div class="building-tools">
                      ${toolsHTML}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;

    renderCapacityVisual(building);
    const tools = getBuildingTools().filter(tool => tool.buildingType === building.name);
    setupToolButtons(building, tools);
    overlay.style.display = 'flex';
  }
}

function renderCapacityVisual(building) {
  const capacityGrid = document.getElementById('capacity-grid');
  if (!capacityGrid) return;

  const totalCapacity = building.capacity;
  const usedCapacity = building.tools ? building.tools.length : 0;

  capacityGrid.innerHTML = '';

  for (let i = 0; i < totalCapacity; i++) {
    const cell = document.createElement('div');
    cell.className = 'capacity-cell';

    if (i < usedCapacity) {
      const tool = building.tools[i];
      const iconPath = `/assets/icon/buildings/${tool.name.toLowerCase()}.png`;
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