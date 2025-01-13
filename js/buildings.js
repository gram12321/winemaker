import { loadBuildings } from '/js/database/adminFunctions.js';
import { showBuildingOverlay } from './overlays/buildingOverlay.js';
import { addConsoleMessage } from '/js/console.js';
import { storeBuildings } from '/js/database/adminFunctions.js';
import { addTransaction} from '/js/finance.js';
import { formatNumber } from '/js/utils.js';

export class Building {
  static BASE_COSTS = {
    'Tool Shed': 500000,
    'Warehouse': 1000000
  };

  constructor(name, level = 1, tools = []) {
    this.name = name;
    this.level = level;
    this.baseCost = Building.BASE_COSTS[name] || 500000;
    this.capacity = this.calculateCapacity();
    this.tools = tools;
  }

  calculateCapacity() {
    return this.level * 2;
  }

  addTool(tool) {
    if (this.tools.length < this.capacity) {
      this.tools.push(tool);
      return true;
    }
    return false;
  }

  removeTool(toolName) {
    const toolIndex = this.tools.findIndex(tool => tool.name === toolName);
    if (toolIndex >= 0) {
      this.tools.splice(toolIndex, 1);
      return true;
    }
    return false;
  }

  upgrade() {
    this.level += 1;
    this.capacity = this.calculateCapacity();
    return true;
  }

  getUpgradeCost() {
    return Math.floor(this.baseCost * Math.pow(1.5, this.level));
  }

  listContents() {
    if (this.tools.length === 0) {
      return "No tools stored.";
    }
    const toolCounts = this.tools.reduce((acc, tool) => {
      acc[tool.name] = (acc[tool.name] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(toolCounts)
      .map(([name, count]) => {
        const iconPath = `/assets/icon/buildings/${name.toLowerCase()}.png`;
        return `<div>
                  <img src="${iconPath}" alt="${name}" style="width: 24px; height: 24px; vertical-align: middle;" />
                  ${count} 
                </div>`;
      })
      .join('<br>');
  }
}

class Tool {
  static instanceCount = {};

  constructor(name, buildingType, speedBonus = 1.0, cost = 0, capacity = 0, supportedResources = []) {
    this.name = name;
    this.buildingType = buildingType;
    this.speedBonus = speedBonus;
    this.cost = cost;
    this.capacity = capacity;
    this.supportedResources = supportedResources;
    this.instanceNumber = 1; // Default value, will be overridden by ToolManager
  }

  getStorageId() {
    return `${this.name} #${this.instanceNumber}`;
  }

  canStore(resourceName) {
    return this.supportedResources.length === 0 || this.supportedResources.includes(resourceName);
  }

  getCurrentAmount(inventory) {
    const contents = inventory.getStorageContents(this.getStorageId());
    return contents.reduce((sum, item) => sum + item.amount, 0);
  }

  getAvailableSpace(inventory) {
    return this.capacity - this.getCurrentAmount(inventory);
  }
}

const ToolManager = (() => {
  let toolsInitialized = false;
  let tools = [];
  let toolInstanceCounts = {};

  function initializeTools() {
    if (!toolsInitialized) {
      // Reset tool instance counts
      toolInstanceCounts = {};
      
      tools = [
        new Tool('Tractor', 'Tool Shed', 1.2, 500, 0),
        new Tool('Trimmer', 'Tool Shed', 1.1, 300, 0),
        new Tool('Forklift', 'Warehouse', 1.0, 400, 0),
        new Tool('Pallet Jack', 'Warehouse', 1.0, 150, 0),
        new Tool('Harvest Bins', 'Warehouse', 1.1, 1000, 0, ['Grapes']),
        new Tool('Fermentation Tank', 'Warehouse', 1.0, 600000, 20000, ['Must']),
        new Tool('Macro Bins', 'Warehouse', 1.0, 750, 5000, ['Grapes']),
        new Tool('Lug Box', 'Warehouse', 1.0, 50, 20000, ['Grapes']),
        new Tool('Grape Gondola', 'Warehouse', 1.0, 2000, 180000, ['Grapes'])
      ];
      toolsInitialized = true;
    }
    return tools;
  }

  function createToolInstance(toolName) {
    const toolTemplate = tools.find(tool => tool.name === toolName);
    if (toolTemplate) {
      // Initialize counter if not exists
      if (!toolInstanceCounts[toolName]) {
        toolInstanceCounts[toolName] = 0;
      }
      // Increment counter
      toolInstanceCounts[toolName]++;
      
      const newTool = new Tool(
        toolTemplate.name,
        toolTemplate.buildingType,
        toolTemplate.speedBonus,
        toolTemplate.cost,
        toolTemplate.capacity,
        toolTemplate.supportedResources || []
      );
      // Override the instance number with our managed count
      newTool.instanceNumber = toolInstanceCounts[toolName];
      return newTool;
    }
    console.log('Tool template not found');
    return null;
  }

  return {
    getTools: initializeTools,
    createToolInstance
  };
})();

export const getBuildingTools = () => ToolManager.getTools();
export const createTool = (toolName) => ToolManager.createToolInstance(toolName);

export function buildBuilding(buildingName) {
  const buildings = loadBuildings();
  const existingBuilding = buildings.find(b => b.name === buildingName);

  if (existingBuilding) {
    addConsoleMessage(`${buildingName} already exists and cannot be built again.`);
    return;
  }

  const buildingCost = Building.BASE_COSTS[buildingName] || 500000;
  addTransaction('Expense', `Construction of ${buildingName}`, -buildingCost);
  
  const newBuilding = new Building(buildingName);
  buildings.push(newBuilding);
  storeBuildings(buildings);

  const buildButton = document.querySelector(`.build-button[data-building-name="${buildingName}"]`);
  const upgradeButton = document.querySelector(`.upgrade-button[data-building-name="${buildingName}"]`);

  if (buildButton && upgradeButton) {
    buildButton.disabled = true;
    buildButton.textContent = "Built";
    upgradeButton.disabled = false;
  }

  addConsoleMessage(`${buildingName} has been built successfully. <span style="color: red">Cost: €${formatNumber(buildingCost)}</span>. Capacity: ${newBuilding.capacity} (${newBuilding.capacity} spaces available)`);
  updateBuildingCards();
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
    const building = isBuilt ? new Building(buildingData.name, buildingData.level, buildingData.tools || []) : null;

    cardDiv.classList.toggle('unbuilt-card', !isBuilt);

    detailDiv.innerHTML = `
      <p><strong>${buildingName}</strong></p>
      <p>Status: ${isBuilt ? "Operational" : "Unbuilt"}</p>
      <p>Level: ${isBuilt ? building.level : 0}</p>
      <p>Upgrade Cost: ${isBuilt ? `€${building.getUpgradeCost()}` : "N/A"}</p>
      <p>Capacity: ${isBuilt ? building.capacity : 0}</p>
      <p>Content: <br> ${isBuilt && building.tools && building.tools.length > 0 ? building.listContents() : "No tools stored."}</p>
    `;

    if (isBuilt) {
      cardDiv.onclick = () => showBuildingOverlay(building);
    } else {
      cardDiv.onclick = null;
    }
  });
}

export function upgradeBuilding(buildingName) {
  const buildings = loadBuildings();
  const buildingData = buildings.find(b => b.name === buildingName);

  if (!buildingData) {
    addConsoleMessage(`Building ${buildingName} not found.`);
    return;
  }

  const building = new Building(buildingData.name, buildingData.level, buildingData.tools || []);
  const upgradeCost = building.getUpgradeCost();
  
  // Deduct the upgrade cost
  addTransaction('Expense', `Upgraded ${buildingName} to level ${building.level + 1}`, -upgradeCost);
  
  building.upgrade();

  const updatedBuildings = buildings.map(b => b.name === buildingName ? building : b);
  storeBuildings(updatedBuildings);

  addConsoleMessage(`${buildingName} has been upgraded to level ${building.level}. <span style="color: red">Cost: €${formatNumber(upgradeCost)}</span>. New Capacity: ${building.capacity} (${building.capacity - (building.tools ? building.tools.length : 0)} spaces available)`);
  updateBuildingCards();
}