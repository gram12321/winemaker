import { loadBuildings } from '/js/database/adminFunctions.js';
import { showBuildingOverlay } from './overlays/buildingOverlay.js';
import { addConsoleMessage } from '/js/console.js';
import { storeBuildings } from '/js/database/adminFunctions.js';

export class Building {
  constructor(name, level = 1) {
    this.name = name;
    this.level = level;
    this.capacity = this.calculateCapacity();
    this.tools = [];
    this.status = "Operational";
  }

  calculateCapacity() {
    return this.level * 2;
  }

  addTool(tool) {
    if (this.tools.length < this.capacity) {
      this.tools.push(tool);
      return true;
    }
    console.log(`${this.name} is full! Upgrade to store more tools.`);
    return false;
  }

  removeTool(toolName) {
    const toolIndex = this.tools.findIndex(tool => tool.name === toolName);
    if (toolIndex >= 0) {
      this.tools.splice(toolIndex, 1);
      console.log(`${toolName} removed from ${this.name}.`);
    } else {
      console.log(`${toolName} not found in ${this.name}.`);
    }
  }

  upgrade() {
    this.level += 1;
    this.capacity = this.calculateCapacity();
    console.log(`${this.name} upgraded! New level is ${this.level} and capacity is ${this.capacity}.`);
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

  getStatus() {
    return this.status;
  }

  getStatus() {
    return this.level > 0 ? "Operational" : "Unbuilt";
  }

  getUpgradeCost() {
    return this.level * 10;
  }

  getContentDescription() {
    return this.contents.length > 0 ? this.listContents() : "No items stored.";
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
    this.instanceNumber = this.getNextInstanceNumber();
  }

  getNextInstanceNumber() {
    if (!Tool.instanceCount[this.name]) {
      Tool.instanceCount[this.name] = 0;
    }
    Tool.instanceCount[this.name] += 1;
    return Tool.instanceCount[this.name];
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

  function initializeTools() {
    if (!toolsInitialized) {
      tools = [
        new Tool('Tractor', 'Tool Shed', 1.2, 500, 0),
        new Tool('Trimmer', 'Tool Shed', 1.1, 300, 0),
        new Tool('Forklift', 'Warehouse', 1.0, 400, 0),
        new Tool('Pallet Jack', 'Warehouse', 1.0, 150, 0),
        new Tool('Harvest Bins', 'Warehouse', 1.0, 1000, 5, ['Grapes']),
        new Tool('Fermentation Tank', 'Warehouse', 1.0, 6000, 2000, ['Must'])
      ];
      toolsInitialized = true;
    }
    return tools;
  }

  function createToolInstance(toolName) {
    const toolTemplate = tools.find(tool => tool.name === toolName);
    if (toolTemplate) {
      return new Tool(
        toolTemplate.name,
        toolTemplate.buildingType,
        toolTemplate.speedBonus,
        toolTemplate.cost,
        toolTemplate.capacity,
        toolTemplate.supportedResources || []
      );
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

  addConsoleMessage(`${buildingName} has been built successfully.`);
  updateBuildingCards();
}

export function updateBuildingCards() {
  document.querySelectorAll('.building-card').forEach(cardDiv => {
    const detailDiv = cardDiv.querySelector('.building-details');
    const buildingName = detailDiv.getAttribute('data-building-name');
    const buildings = loadBuildings();
    const building = buildings.find(b => b.name === buildingName);

    const status = building ? building.getStatus() : "Unbuilt";
    const level = building ? building.level : 0;
    const capacity = building ? building.capacity : 0;
    const upgradeCost = building ? building.getUpgradeCost() : "N/A";
    const content = building ? building.getContentDescription() : "No items stored.";

    if (status === "Unbuilt") {
      cardDiv.classList.add('unbuilt-card');
    } else {
      cardDiv.classList.remove('unbuilt-card');
    }

    detailDiv.innerHTML = `
      <p><strong>${buildingName}</strong></p>
      <p>Status: ${status}</p>
      <p>Level: ${level}</p>
      <p>Upgrade Cost: ${upgradeCost}</p>
      <p>Capacity: ${capacity}</p>
      <p>Content: <br> ${content}</p>
    `;

    if (building) {
      cardDiv.addEventListener('click', () => showBuildingOverlay(building));
    }
  });
}

export function upgradeBuilding(buildingName) {
  const buildings = loadBuildings();
  const building = buildings.find(b => b.name === buildingName);

  if (!building) {
    console.error(`Building ${buildingName} not found.`);
    return;
  }

  const upgradeCost = building.getUpgradeCost();
  building.upgrade();

  const updatedBuildings = buildings.map(b => b.name === buildingName ? building : b);
  storeBuildings(updatedBuildings);

  const upgradeButton = document.querySelector(`.upgrade-button[data-building-name="${buildingName}"]`);
  if (upgradeButton) {
    upgradeButton.disabled = false;
    upgradeButton.textContent = "Upgrade";
  }

  addConsoleMessage(`${buildingName} has been upgraded to level ${building.level}.`);
  updateBuildingCards();
}