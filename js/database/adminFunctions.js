import { inventoryInstance } from '/js/resource.js';
import { Building } from '/js/buildings.js';
import { Tool, getBuildingTools  } from '/js/buildings.js';

// Function to load inventory from localStorage
function loadInventory() {
  let savedInventory = localStorage.getItem('playerInventory');

  try {
    savedInventory = JSON.parse(savedInventory);
    if (!Array.isArray(savedInventory)) {
      savedInventory = [];
    }
  } catch (error) {
    console.warn("Failed to parse playerInventory from localStorage. Initializing with empty array.");
    savedInventory = [];
  }

  // Clear existing inventory
  inventoryInstance.items = [];

  // Populate the inventory instance with saved data
  savedInventory.forEach(item => {
    const newItem = inventoryInstance.addResource(
      { name: item.resource.name, naturalYield: item.resource.naturalYield || 1 },
      item.amount,
      item.state,
      item.vintage,
      item.quality,
      item.fieldName,
      item.fieldPrestige,
      item.storage
    );

    // Restore grape characteristics if they exist
    if (newItem && item.state === 'Grapes') {
      const characteristics = [
        'sweetness',
        'acidity',
        'tannins',
        'body',
        'spice',
        'aroma'
      ];

      characteristics.forEach(char => {
        if (typeof item[char] === 'number') {
          newItem[char] = item[char];
        }
      });
    }
  });
}

// Load the inventory at the start
loadInventory();

// Function to save inventory to localStorage
function saveInventory() {
  // Save all item properties including grape characteristics
  const itemsToSave = inventoryInstance.items.map(item => {
    const savedItem = {
      resource: {
        name: item.resource.name,
        naturalYield: item.resource.naturalYield
      },
      amount: item.amount,
      state: item.state,
      vintage: item.vintage,
      quality: item.quality,
      fieldName: item.fieldName,
      fieldPrestige: item.fieldPrestige,
      storage: item.storage
    };

    // Add grape characteristics if they exist
    if (item.state === 'Grapes') {
      const characteristics = [
        'sweetness',
        'acidity',
        'tannins',
        'body',
        'spice',
        'aroma'
      ];

      characteristics.forEach(char => {
        if (typeof item[char] === 'number') {
          savedItem[char] = item[char];
        }
      });
    }

    return savedItem;
  });

  localStorage.setItem('playerInventory', JSON.stringify(itemsToSave));
}


export function saveWineOrders(wineOrders) {
  localStorage.setItem('wineOrders', JSON.stringify(wineOrders));
}

export function loadWineOrders() {
  const savedWineOrders = localStorage.getItem('wineOrders');
  if (savedWineOrders) {
    try {
      return JSON.parse(savedWineOrders);
    } catch (error) {
      console.error("Failed to parse wine orders from localStorage.", error);
      return [];
    }
  }
  return [];
}

// Functions to save and load buildings from localStorage
export function storeBuildings(buildings) {
  try {
    // Validate input
    if (!Array.isArray(buildings)) {
      console.warn('Invalid buildings data format, resetting to empty array');
      buildings = [];
    }

    // Convert building instances to plain objects for storage
    const buildingsToStore = buildings.map(building => ({
      name: building.name,
      level: building.level,
      slots: building.slots.map(slot => ({
        tools: slot.tools.map(tool => ({
          name: tool.name,
          buildingType: tool.buildingType,
          speedBonus: tool.speedBonus,
          cost: tool.cost,
          capacity: tool.capacity,
          supportedResources: tool.supportedResources || [],
          instanceNumber: tool.instanceNumber,
          weight: tool.weight,
          validTasks: tool.validTasks,
          toolType: tool.toolType,  // Add toolType to storage
          assignedTaskId: tool.assignedTaskId, // Add this line
        })),
        currentWeight: slot.currentWeight
      }))
    }));

    localStorage.setItem('buildings', JSON.stringify(buildingsToStore));
    return true;
  } catch (error) {
    console.error('Error storing buildings:', error);
    localStorage.setItem('buildings', '[]');
    return false;
  }
}

export function loadBuildings() {
  const buildingsJSON = localStorage.getItem('buildings');
  if (!buildingsJSON) return [];

  try {
    const buildingsData = JSON.parse(buildingsJSON);
    return buildingsData.map(buildingData => {
      const building = new Building(buildingData.name, buildingData.level);
      
      if (buildingData.slots) {
        building.slots = buildingData.slots.map(slotData => ({
          tools: slotData.tools.map(toolData => {
            const defaultTool = getBuildingTools().find(t => t.name === toolData.name);
            
            const tool = new Tool(
              toolData.name,
              toolData.buildingType,
              toolData.speedBonus,
              toolData.cost,
              toolData.capacity,
              toolData.supportedResources || [],
              toolData.weight,
              toolData.validTasks || [],
              toolData.toolType || 'individual',
              defaultTool ? defaultTool.assignable : true  // Use default tool's assignable property
            );
            tool.instanceNumber = toolData.instanceNumber;
            tool.assignedTaskId = toolData.assignedTaskId;
            tool.assignable = defaultTool ? defaultTool.assignable : true; // Explicitly set assignable
            return tool;
          }),
          currentWeight: slotData.currentWeight
        }));
      }

      return building;
    });
  } catch (error) {
    console.error('Error loading buildings:', error);
    return [];
  }
}

// Functions to save and load upgrades from localStorage
export function storeUpgrades(upgrades) {
  localStorage.setItem('upgrades', JSON.stringify(upgrades));
}

export function loadUpgrades() {
  const upgradesJSON = localStorage.getItem('upgrades');
  if (upgradesJSON) {
    return JSON.parse(upgradesJSON);
  }
  return [];
}

// Function to load farmlands from localStorage
let farmlandsStore = [];

export function getFarmlandsStore() {
    return farmlandsStore;
}

export function setFarmlandsStore(newStore) {
    farmlandsStore = newStore;
}

export function loadFarmlands() {
  const farmlandsJSON = localStorage.getItem('ownedFarmlands');
  if (farmlandsJSON) {
    farmlandsStore = JSON.parse(farmlandsJSON);
  }
  return farmlandsStore;
}

function saveFarmlandsToStorage() {
  localStorage.setItem('ownedFarmlands', JSON.stringify(farmlandsStore));
}

export function addFarmland(farmland) {
  farmlandsStore.push(farmland);
  saveFarmlandsToStorage();
}

export function updateFarmland(farmlandId, updates) {
  const farmlands = loadFarmlands();
  const farmlandIndex = farmlands.findIndex(f => f.id === parseInt(farmlandId));

  if (farmlandIndex !== -1) {
    farmlands[farmlandIndex] = {
      ...farmlands[farmlandIndex],
      ...updates
    };
    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
    return true;
  }
  return false;
}

// Farmland management functions
export function getFarmlands() {
  return JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
}

export function updateAllFarmlands(farmlands) {
  localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
}

// Game state management functions
export function getGameState() {
  return {
    week: parseInt(localStorage.getItem('week'), 10) || 1,
    season: localStorage.getItem('season') || 'Spring',
    year: parseInt(localStorage.getItem('year'), 10) || 2023
  };
}

export function updateGameState(week, season, year) {
  localStorage.setItem('week', week);
  localStorage.setItem('season', season);
  localStorage.setItem('year', year);
}

export function getMoney() {
  return parseFloat(localStorage.getItem('money') || '0');
}

export function getCompanyName() {
  return localStorage.getItem('companyName');
}

// Prestige storage functions
export function getPrestigeHit() {
  const prestigeHit = localStorage.getItem('prestigeHit');
  return prestigeHit === null ? 0 : Number(prestigeHit);
}

export function setPrestigeHit(value) {
  if (value === null || value === undefined) {
    localStorage.removeItem('prestigeHit');
  } else {
    localStorage.setItem('prestigeHit', Number(value));
  }
}

export function saveCalculatedPrestige(value) {
  localStorage.setItem('calculatedPrestige', value.toString());
}

export function getCalculatedPrestige() {
  return parseFloat(localStorage.getItem('calculatedPrestige') || '0');
}

// Task persistence functions
export function saveTasks(tasks) {
  const taskData = Array.from(tasks.entries()).map(([id, task]) => ({
    id: task.id,
    name: task.name,
    type: task.type,
    taskType: task.taskType,
    totalWork: task.totalWork, // Save totalWork
    appliedWork: task.appliedWork, // Save appliedWork
    progress: task.progress,
    target: task.target,
    params: {
      ...task.params,
      selectedTools: Array.isArray(task.params.selectedTools) ? 
        task.params.selectedTools.map(t => t.toString()) : 
        []
    },
    assignedStaff: task.assignedStaff // Include assigned staff
  }));
  localStorage.setItem('activeTasks', JSON.stringify(taskData));
}

export function loadTasks() {
  const taskData = JSON.parse(localStorage.getItem('activeTasks') || '[]');
  const tasks = new Map();
  taskData.forEach(task => {
    tasks.set(task.id, {
      ...task,
      params: {
        ...task.params,
        selectedTools: Array.isArray(task.params.selectedTools) ? 
          task.params.selectedTools.map(t => t.toString()) : 
          []
      },
      callback: null
    });
  });
  return tasks;
}

export function getTransactions() {
  return JSON.parse(localStorage.getItem('transactions')) || [];
}

export function storeTransactions(transactions) {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

export function updateMoney(amount) {
  const currentMoney = getMoney();
  localStorage.setItem('money', currentMoney + amount);
}

export function updateRecurringTransactions(transactions) {
  localStorage.setItem('recurringTransactions', JSON.stringify(transactions));
}

export function getRecurringTransactions() {
  return JSON.parse(localStorage.getItem('recurringTransactions')) || [];
}

export {
  loadInventory,
  saveInventory
};

