import { loadBuildings } from '/js/database/adminFunctions.js';
import { showBuildingOverlay } from './overlays/buildingOverlay.js';
import { addConsoleMessage } from '/js/console.js';
import { storeBuildings } from '/js/database/adminFunctions.js';
import { addTransaction} from '/js/finance.js';
import { formatNumber } from '/js/utils.js';
import taskManager from '/js/taskManager.js';

export class Building {
  static BUILDINGS = {
    'Tool Shed': {
      baseCost: 500000,
      weightCapacity: 10,
      slotWeightCapacity: 5
    },
    'Warehouse': {
      baseCost: 1000000,
      weightCapacity: 15,
      slotWeightCapacity: 8
    },
    'Office': {
      baseCost: 750000,
      weightCapacity: 5,
      slotWeightCapacity: 3
    },
    'Wine Cellar': {
      baseCost: 2000000,
      weightCapacity: 20,
      slotWeightCapacity: 10
    },
    'Winery': {
      baseCost: 1500000,
      weightCapacity: 15,
      slotWeightCapacity: 8
    }
  };

  getConfig(name) {
    return Building.BUILDINGS[name] || Building.BUILDINGS['Tool Shed'];
  }

  constructor(name, level = 1, tools = []) {
    this.name = name;
    this.level = level;
    this.baseCost = this.getConfig(name).baseCost;
    this.capacity = this.calculateCapacity();
    this.slotWeightCapacity = this.getConfig(name).slotWeightCapacity;
    this.slots = Array(this.capacity).fill().map(() => ({ tools: [], currentWeight: 0 }));

    // Initialize slots with existing tools
    if (tools && tools.length > 0) {
      tools.forEach(tool => {
        // Create proper Tool instance if it's a plain object
        const toolInstance = tool instanceof Tool ? tool : 
          new Tool(tool.name, tool.buildingType, tool.speedBonus, tool.cost, 
                  tool.capacity, tool.supportedResources, tool.weight, tool.validTasks, tool.toolType);
        toolInstance.instanceNumber = tool.instanceNumber;
        this.addTool(toolInstance);
      });
    }
  }

  calculateCapacity() {
    return this.level * 3;
  }

  getCurrentWeight() {
    return this.slots.reduce((total, slot) => total + slot.currentWeight, 0);
  }

  getRemainingWeight() {
    return this.totalWeightCapacity - this.getCurrentWeight();
  }

  findAvailableSlot(tool) {
    const adjustedWeight = tool.getAdjustedWeight();
    
    // First, try to find a slot that already has the same type of tool
    let slot = this.slots.find(slot => 
      slot.tools.length > 0 && 
      slot.tools[0].name === tool.name && 
      slot.currentWeight + adjustedWeight <= this.slotWeightCapacity
    );

    // If no matching slot found, try to find an empty slot
    if (!slot) {
      slot = this.slots.find(slot => 
        slot.tools.length === 0 && 
        adjustedWeight <= this.slotWeightCapacity
      );
    }

    return slot;
  }

  addTool(tool) {
    const slot = this.findAvailableSlot(tool);
    if (slot) {
      slot.tools.push(tool);
      // Use adjusted weight instead of base weight
      slot.currentWeight += tool.getAdjustedWeight();
      return true;
    }
    return false;
  }

  upgrade() {
    this.level += 1;
    const newCapacity = this.calculateCapacity();
    // Add new empty slots for the increased capacity
    const additionalSlots = newCapacity - this.capacity;
    this.slots = [
      ...this.slots,
      ...Array(additionalSlots).fill().map(() => ({ tools: [], currentWeight: 0 }))
    ];
    this.capacity = newCapacity;
    return true;
  }

  getUpgradeCost() {
    return Math.floor(this.baseCost * Math.pow(1.5, this.level));
  }

  listContents() {
    const allTools = this.getAllTools();
    if (allTools.length === 0) {
      return "No tools stored.";
    }

    const toolCounts = allTools.reduce((acc, tool) => {
      acc[tool.name] = (acc[tool.name] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(toolCounts)
      .map(([name, count]) => {
        const iconPath = `/assets/icon/buildings/${name.toLowerCase()}.png`;
        return `<div>
                  <img src="${iconPath}" alt="${name}" style="width: 24px; height: 24px; vertical-align: middle;" />
                  ${count}x ${name}
                </div>`;
      })
      .join('<br>');
  }

  getAllTools() {
    return this.slots.flatMap(slot => slot.tools);
  }

  sellToolFromSlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (slot && slot.tools.length > 0) {
      const tool = slot.tools.pop(); // Remove last tool from slot
      // Use adjusted weight for removal too
      slot.currentWeight -= tool.getAdjustedWeight();
      
      // Add this check to clear slot if empty
      if (slot.tools.length === 0) {
        // Reset slot to empty state
        slot.currentWeight = 0;
      }
      
      return {
        tool,
        refundAmount: Math.floor(tool.cost / 2) // 50% refund
      };
    }
    return null;
  }
}

export class Tool {
  static instanceCount = {};

  constructor(name, buildingType, speedBonus = 1.0, cost = 0, capacity = 0, supportedResources = [], weight = 1, validTasks = [], toolType = 'individual') {
    this.name = name;
    this.buildingType = buildingType;
    this.speedBonus = speedBonus;
    this.cost = cost;
    this.capacity = capacity; // capacity in kg or liters
    this.supportedResources = supportedResources;
    this.instanceNumber = 1; // Default value, will be overridden by ToolManager
    this.weight = weight; // Default weight of 1 if not specified
    this.validTasks = validTasks; // Now this will contain task names like 'harvest', 'planting' instead of types
    this.toolType = toolType;  // Add new property
    this.assignedTaskId = null; // Add this property to track which task the tool is assigned to
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

  isValidForTask(taskName) {
    return this.validTasks.some(task => 
      task.toLowerCase() === taskName.toLowerCase()
    );
  }

  isAvailable() {
    return this.assignedTaskId === null;
  }

  assignToTask(taskId) {
    if (this.isAvailable()) {
      this.assignedTaskId = taskId;
      return true;
    }
    return false;
  }

  releaseFromTask() {
    this.assignedTaskId = null;
  }

  getAdjustedWeight() {
    // Get completed upgrades that affect weight
    const completedUpgrades = JSON.parse(localStorage.getItem('upgrades') || '[]');
    const weightReduction = completedUpgrades
        .filter(u => u.completed && u.benefits.toolWeightReduction)
        .reduce((total, upgrade) => total + upgrade.benefits.toolWeightReduction, 0);

    // Apply weight reduction
    return this.weight * (1 - weightReduction);
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
        // Tool Shed Tools
        new Tool('Tractor', 'Tool Shed', 1.2, 2500, 0, [], 5, ['planting', 'harvesting', 'clearing', 'uprooting'], 'task'),
        new Tool('Trimmer', 'Tool Shed', 1.1, 1300, 0, [], 1, ['planting', 'clearing'], 'task'),
        new Tool('Harvest Bins', 'Tool Shed', 1.1, 700, 0, ['Grapes'], 1, ['harvesting'], 'individual'),
        new Tool('Lug Box', 'Tool Shed', 1.05, 500, 0, ['Grapes'], 1, ['harvesting'], 'individual'),

        // Warehouse Tools
        new Tool('Forklift', 'Warehouse', 1.2, 2000, 0, [], 6, ['crushing', 'fermentation', 'Building & Maintenance'], 'task'),
        new Tool('Pallet Jack', 'Warehouse', 1.1, 1500, 0, [], 3, ['crushing', 'fermentation', 'Building & Maintenance'], 'individual'),
        new Tool('Macro Bin', 'Warehouse', 1.05, 1050, 1000, ['Grapes'], 2, ['crushing'], 'individual'),
        new Tool('Grape Gondola', 'Warehouse', 1.0, 10000, 8000, ['Grapes'], 8, ['crushing'], 'task'),

        // Winery Tools
        new Tool('Fermentation Tank', 'Winery', 1.0, 600000, 20000, ['Must'], 8, ['fermentation'], 'task'),
        new Tool('Manual Grape Crusher', 'Winery', 1.0, 5000, 0, ['Grapes'], 2, ['crushing'], 'task'),
        new Tool('Mechanical Crusher', 'Winery', 1.2, 15000, 0, ['Grapes'], 3, ['crushing'], 'task'),
        new Tool('Crusher-Destemmer', 'Winery', 1.3, 35000, 0, ['Grapes'], 4, ['crushing'], 'task'),
        new Tool('Pneumatic Press', 'Winery', 1.4, 75000, 0, ['Grapes'], 5, ['pressing'], 'task'),
        new Tool('Advanced Press', 'Winery', 1.5, 150000, 0, ['Grapes'], 6, ['pressing'], 'task'),
        new Tool('Plastic Fermentation Bin', 'Winery', 1.0, 8000, 1000, ['Must'], 3, ['fermentation'], 'task'),
        new Tool('Stainless Steel Tank', 'Winery', 1.2, 25000, 2000, ['Must'], 5, ['fermentation'], 'task'),
        new Tool('Concrete Tank', 'Winery', 1.3, 45000, 3000, ['Must'], 8, ['fermentation'], 'task'),
        new Tool('Oak Fermentation Barrel', 'Winery', 1.4, 85000, 500, ['Must'], 2, ['fermentation'], 'task'),

        // Office Tools
        new Tool('Desk', 'Office', 1.1, 500, 0, [], 1, ['administration'], 'individual'),
        new Tool('Computer', 'Office', 1.3, 2000, 0, [], 1, ['administration'], 'individual') // maybe we could make somethingabout a requirement for Desk before computer
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
        toolTemplate.supportedResources || [],
        toolTemplate.weight,
        toolTemplate.validTasks,
        toolTemplate.toolType
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

  const buildingCost = Building.BUILDINGS[buildingName]?.baseCost || 500000;

  // Initial state changes
  const buildButton = document.querySelector(`.build-button[data-building-name="${buildingName}"]`);
  const upgradeButton = document.querySelector(`.upgrade-button[data-building-name="${buildingName}"]`);

  if (buildButton && upgradeButton) {
    buildButton.disabled = true;
    buildButton.textContent = "Building...";
  }

  // Add to transaction history
  addTransaction('Expense', `Construction of ${buildingName}`, -buildingCost);

  // Add initial message
  addConsoleMessage(`Construction of ${buildingName} has begun. <span style="color: red">€${formatNumber(buildingCost)}</span> has been deducted from your account. When complete, capacity will be ${new Building(buildingName).calculateCapacity()} spaces.`);

  // Create building task
  taskManager.addCompletionTask(
    'Building & Maintenance',
    'maintenance',
    buildingCost / 1000, // Total work required based on building cost
    (target, params) => {
      // Completion callback
      const newBuilding = new Building(buildingName);
      const buildings = loadBuildings();
      buildings.push(newBuilding);
      storeBuildings(buildings);

      if (buildButton && upgradeButton) {
        buildButton.textContent = "Built";
        upgradeButton.disabled = false;
      }

      addConsoleMessage(`${buildingName} has been built successfully. <span style="color: red">Cost: €${formatNumber(buildingCost)}</span>. Capacity: ${newBuilding.capacity} (${newBuilding.capacity} spaces available)`);
      updateBuildingCards();
      updateBuildButtonStates();
    },
    { name: buildingName }, // Change: Pass building name as an object with name property
    { buildingCost }
  );
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

export function upgradeBuilding(buildingName) {
  const buildings = loadBuildings();
  const buildingData = buildings.find(b => b.name === buildingName);

  if (!buildingData) {
    addConsoleMessage(`Building ${buildingName} not found.`);
    return;
  }

  const building = new Building(buildingData.name, buildingData.level, buildingData.tools || []);
  const upgradeCost = building.getUpgradeCost();

  // Add to transaction history
  addTransaction('Expense', `Upgrade of ${buildingName}`, -upgradeCost);

  // Add initial message
  addConsoleMessage(`Upgrade of ${buildingName} has begun. <span style="color: red">€${formatNumber(upgradeCost)}</span> has been deducted from your account.`);

  // Create upgrade task
  taskManager.addCompletionTask(
    'Building & Maintenance',
    'maintenance',
    upgradeCost / 1000, // Total work required based on upgrade cost
    (target, params) => {
      // Completion callback
      const buildings = loadBuildings();
      const buildingToUpgrade = buildings.find(b => b.name === params.buildingName);

      if (buildingToUpgrade) {
        const building = new Building(buildingToUpgrade.name, buildingToUpgrade.level, buildingToUpgrade.slots?.flatMap(slot => slot.tools) || []);
        building.upgrade();
        // Remove this line as it's incorrect:
        // building.tools = buildingToUpgrade.tools || []; 
        
        // The tools are already preserved through the constructor and slots

        const updatedBuildings = buildings.map(b => 
          b.name === params.buildingName ? building : b
        );
        storeBuildings(updatedBuildings);

        addConsoleMessage(`${buildingName} has been upgraded to level ${building.level}. <span style="color: red">Cost: €${formatNumber(upgradeCost)}</span>. New Capacity: ${building.capacity} (${building.capacity - (building.tools ? building.tools.length : 0)} spaces available)`);
        updateBuildingCards();
        updateBuildButtonStates();
      }
    },
    { name: buildingName }, // Change: Pass building name as an object with name property
    { buildingName, upgradeCost } // Ensure buildingName is passed in params
  );
}