import { getBuildingTools, createTool, Building } from '../buildings.js';
import { addConsoleMessage } from '/js/console.js';
import { storeBuildings, loadBuildings } from '/js/database/adminFunctions.js';
import { addTransaction } from '../finance.js';
import { formatNumber } from '../utils.js';
import { updateAllDisplays } from '/js/displayManager.js';
import { showStandardOverlay, hideOverlay, setupStandardOverlayClose } from './overlayUtils.js';

function createBuildingDetails(building) {
  const tools = getBuildingTools()
    .filter(tool => tool.buildingType === building.name)
    .sort((a, b) => a.cost - b.cost); // Sort all tools by cost first
  
  // Group pre-sorted tools by their supported resources
  const generalTools = tools.filter(tool => !tool.supportedResources || tool.supportedResources.length === 0);
  const grapeTools = tools.filter(tool => tool.supportedResources?.includes('Grapes'));
  const mustTools = tools.filter(tool => tool.supportedResources?.includes('Must'));

  const createToolSection = (tools, title) => `
    <div class="tool-column collapsed">
      <h4 class="tool-column-header h5 mb-0" onclick="this.closest('.tool-column').classList.toggle('collapsed')">
        ${title}
        <span class="expand-icon">▼</span>
      </h4>
      <div class="tool-column-content">
        ${tools.map(tool => `
          <div class="tool-container">
            <div class="tool-header">
              <button class="add-tool-button btn btn-light btn-sm overlay-section-btn" data-tool-name="${tool.name}">
                Add ${tool.name}
              </button>
            </div>
            <div class="collapsible-content">
              <div class="tool-stats">
                <div>
                  <img src="/assets/icon/small/gold_black.png" alt="Cost" class="stat-icon" title="Cost">
                  €${formatNumber(tool.cost)}
                </div>
                ${tool.speedBonus !== 1.0 ? `
                <div>
                  <img src="/assets/icon/small/speed.png" alt="Speed Bonus" class="stat-icon" title="Speed Bonus">
                  ${(tool.speedBonus * 100 - 100).toFixed(0)}%
                </div>` : ''}
                ${tool.capacity > 0 ? `
                <div>
                  <img src="/assets/icon/small/storage.png" alt="Storage" class="stat-icon" title="Storage">
                  ${formatNumber(tool.capacity)} kg
                </div>` : ''}
                ${tool.supportedResources?.length ? `
                <div>
                  <img src="/assets/icon/small/store.png" alt="Stores" class="stat-icon" title="Stores">
                  ${tool.supportedResources.join(', ')}
                </div>` : ''}
                <div>
                  <img src="/assets/icon/small/weight.png" alt="Weight" class="stat-icon" title="Weight">
                  ${tool.weight} units
                </div>
                ${tool.validTasks?.length ? `
                <div>
                  ${tool.validTasks.map(task => {
                    // Get only the first word and convert to lowercase
                    const iconName = task.split(' ')[0].toLowerCase();
                    return `<img src="/assets/icon/icon_${iconName}.webp" 
                              alt="${task}" 
                              class="tool-tasktype-icon" 
                              title="${task}">`;
                  }).join('')}
                </div>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const toolButtons = `
    <div class="tool-grid">
      ${createToolSection(generalTools, 'General Tools')}
      ${createToolSection(grapeTools, 'Grape Storage')}
      ${createToolSection(mustTools, 'Must Storage')}
    </div>
  `;

  return `
    <div class="card">
      <div class="card-header text-white d-flex justify-content-between align-items-center">
        <h3 class="h5 mb-0">${building.name}</h3>
        <button class="close-btn btn btn-light btn-sm overlay-section-btn">Close</button>
      </div>
      <div class="card-body">
        <div class="building-layout-grid">
          <div class="button-container">
            ${toolButtons}
          </div>
          <div class="building-simulator">
            <div id="capacity-grid" class="capacity-grid"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function ensureBuildingInstance(building) {
  if (building instanceof Building) {
    return building;
  }
  const instance = new Building(building.name, building.level);
  if (building.slots) {
    instance.slots = building.slots;
  }
  return instance;
}

function setupToolButtons(building, tools, overlayContainer) {
    const buildingInstance = ensureBuildingInstance(building);

    tools.forEach(tool => {
        const button = overlayContainer.querySelector(`.add-tool-button[data-tool-name="${tool.name}"]`);
        if (button) {
            button.addEventListener('click', () => {
                // Reload the building data to get fresh state
                const buildings = loadBuildings();
                const currentBuilding = buildings.find(b => b.name === buildingInstance.name);
                const freshBuildingInstance = new Building(
                    currentBuilding.name,
                    currentBuilding.level,
                    currentBuilding.slots?.flatMap(slot => slot.tools) || []
                );

                const newToolInstance = createTool(tool.name);
                if (newToolInstance && freshBuildingInstance.addTool(newToolInstance)) {
                    // Find the slot where the tool was added
                    const slot = freshBuildingInstance.slots.find(s => s.tools.includes(newToolInstance));
                    const expenseMessage = `${newToolInstance.name} #${newToolInstance.instanceNumber} added to ${building.name}. <span style="color: red">Cost: €${formatNumber(newToolInstance.cost)}</span>. Weight: ${slot.currentWeight}/${freshBuildingInstance.slotWeightCapacity} units in slot`;
                    addConsoleMessage(expenseMessage);
                    addTransaction('Expense', `Purchased ${newToolInstance.name} #${newToolInstance.instanceNumber}`, -newToolInstance.cost);

                    // Update buildings storage
                    const buildingToUpdate = buildings.find(b => b.name === building.name);
                    if (buildingToUpdate) {
                        buildingToUpdate.slots = freshBuildingInstance.slots;
                        const updatedBuildings = buildings.map(b => b.name === building.name ? buildingToUpdate : b);
                        storeBuildings(updatedBuildings);
                    }

                    // Update display
                    renderCapacityVisual(freshBuildingInstance);
                    updateAllDisplays();
                } else {
                    addConsoleMessage(`Cannot add ${tool.name}. No suitable slot available in ${building.name}!`);
                }
            });
        }
    });
}

export function showBuildingOverlay(building) {
  const buildingInstance = ensureBuildingInstance(building);
  
  // Clean up any existing building overlays first
  document.querySelectorAll('.overlay').forEach(el => {
    if (el.parentNode) el.parentNode.removeChild(el);
  });
  
  const overlayContainer = showStandardOverlay(createBuildingDetails(buildingInstance));
  renderCapacityVisual(buildingInstance);
  const tools = getBuildingTools().filter(tool => tool.buildingType === buildingInstance.name);
  setupToolButtons(buildingInstance, tools, overlayContainer);
  setupStandardOverlayClose(overlayContainer);
  setupStatsToggles();
  return overlayContainer;
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

function renderCapacityVisual(building) {
  const capacityGrid = document.getElementById('capacity-grid');
  if (!capacityGrid) return;

  const headerText = document.createElement('div');
  headerText.className = 'capacity-header';
  headerText.innerHTML = `
    Building Capacity<br>
    Slots: ${building.slots.filter(slot => slot.tools.length > 0).length}/${building.capacity}
  `;
  capacityGrid.innerHTML = '';
  capacityGrid.appendChild(headerText);

  const gridContainer = document.createElement('div');
  gridContainer.className = 'capacity-grid-container';

  building.slots.forEach((slot, i) => {
    const cell = document.createElement('div');
    cell.className = 'capacity-cell';

    if (slot.tools.length > 0) {
      const tool = slot.tools[0]; // Get first tool for icon and name
      const iconPath = `/assets/icon/buildings/${tool.name.toLowerCase()}.png`;
      const cellContent = document.createElement('div');
      cellContent.className = 'cell-content';
      
      const toolCount = slot.tools.length;
      const weightUsed = slot.currentWeight;
      
      cellContent.innerHTML = `
        <div class="tool-info">
          <img src="${iconPath}" alt="${tool.name}" style="width: 24px; height: 24px;" />
          ${toolCount > 1 ? `<span class="tool-count">${toolCount}x</span>` : ''}
          <div class="tool-tooltip">
            <strong>Slot ${i + 1}:</strong> ${tool.name}<br>
            Count: ${toolCount}x<br>
            Weight: ${weightUsed}/${building.slotWeightCapacity} units
          </div>
        </div>`;

      const toolName = document.createElement('div');
      toolName.className = 'tool-name';
      toolName.textContent = `${tool.name}${toolCount > 1 ? ` (${toolCount}x)` : ''}`;

      cell.appendChild(cellContent);
      cell.appendChild(toolName);

      // Add click handler for selling
      cell.style.cursor = 'pointer';
      cell.addEventListener('click', () => {
        const result = building.sellToolFromSlot(i);
        if (result) {
          const { tool, refundAmount } = result;
          addConsoleMessage(`Sold ${tool.name} #${tool.instanceNumber} for <span style="color: green">€${formatNumber(refundAmount)}</span> (50% of original price)`);
          addTransaction('Income', `Sold ${tool.name} #${tool.instanceNumber}`, refundAmount);

          // Update building in storage
          const buildings = loadBuildings();
          const buildingToUpdate = buildings.find(b => b.name === building.name);
          if (buildingToUpdate) {
            buildingToUpdate.slots = building.slots;
            const updatedBuildings = buildings.map(b => b.name === building.name ? buildingToUpdate : b);
            storeBuildings(updatedBuildings);
          }

          // Refresh display
          renderCapacityVisual(building);
          updateAllDisplays();
        }
      });
      
      // Add sell hint to tooltip
      const tooltipDiv = cell.querySelector('.tool-tooltip');
      tooltipDiv.innerHTML += '<br><span style="color: #aaa">Click to sell for 50% refund</span>';
    } else {
      cell.innerHTML = `<div class="empty-slot">Slot ${i + 1}<br>(Empty, 0/${building.slotWeightCapacity} units)</div>`;
    }

    gridContainer.appendChild(cell);
  });

  capacityGrid.appendChild(gridContainer);
}

export function hideBuildingOverlay() {
  hideOverlay('#buildingOverlay');
  updateAllDisplays();
}