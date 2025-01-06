import { loadBuildings } from '/js/database/adminFunctions.js';
import { showBuildingOverlay } from './overlays/buildingOverlay.js'; // Import the showBuildingOverlay function
import { addConsoleMessage } from '/js/console.js';
import { storeBuildings} from '/js/database/adminFunctions.js';


export class Building {
  constructor(name, level = 1) {
    this.name = name;
    this.level = level;
    this.capacity = this.calculateCapacity();
    this.contents = [];
  }

  calculateCapacity() {
    return this.level * 2;
  }

  addContent(item) {
    if (this.contents.length < this.capacity) {
      this.contents.push(item);
      return true;
    } else {
      console.log(`${this.name} is full! Upgrade to store more items.`);
      return false;
    }
  }

  removeContent(itemName) {
    const itemIndex = this.contents.findIndex(item => item.name === itemName);
    if (itemIndex >= 0) {
      this.contents.splice(itemIndex, 1);
      console.log(`${itemName} removed from ${this.name}.`);
    } else {
      console.log(`${itemName} not found in ${this.name}.`);
    }
  }

  upgrade() {
    this.level += 1;
    this.capacity = this.calculateCapacity();
    console.log(`${this.name} upgraded! New level is ${this.level} and capacity is ${this.capacity}.`);
  }

  listContents() {
    if (this.contents.length === 0) {
      return "No items stored.";
    }
    const itemCounts = this.contents.reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + 1;
      return acc;
    }, {});
    // Generate HTML with icons and counts
    return Object.entries(itemCounts)
      .map(([name, count]) => {
        const iconPath = `/assets/icon/buildings/${name.toLowerCase()}.png`;
        return `<div>
                  <img src="${iconPath}" alt="${name}" style="width: 24px; height: 24px; vertical-align: middle;" />
                  ${count} 
                </div>`;
      })
      .join('<br>');
  }
  

  toJSON() {
    return {
      name: this.name,
      level: this.level,
      capacity: this.capacity,
      contents: this.contents.map(content => content.toJSON())
    };
  }

  static fromJSON(json) {
    const building = new Building(json.name, json.level);
    building.contents = (json.contents || []).map(Tool.fromJSON);
    return building;
  }

  // New methods to get building details for display
  getStatus() {
    return this.level > 0 ? "Operational" : "Unbuilt";
  }

  getUpgradeCost() {
    return this.level * 10; // Example calculation for upgrade cost
  }

  getContentDescription() {
    return this.contents.length > 0 ? this.listContents() : "No items stored.";
  }
}

class Tool {
  static instanceCount = {}; // Static map to hold instance counts for each tool type

  constructor(name, buildingType, speedBonus = 1.0, cost = 0, capacity = 0, supportedResources = []) {
    this.name = name;
    this.buildingType = buildingType;
    this.speedBonus = speedBonus;
    this.cost = cost; // Add cost property
    this.capacity = capacity; // Add capacity property
    this.supportedResources = supportedResources; // Add supportedResources property
    this.instanceNumber = this.getNextInstanceNumber(); // Assign instance number
  }

  getNextInstanceNumber() {
    // Initialize count if it doesn't exist
    if (!Tool.instanceCount[this.name]) {
      Tool.instanceCount[this.name] = 0;
    }
    Tool.instanceCount[this.name] += 1; // Increment the count for this tool type
    return Tool.instanceCount[this.name]; // Return the current instance number
  }

  toJSON() {
    return {
      name: this.name,
      buildingType: this.buildingType,
      speedBonus: this.speedBonus,
      cost: this.cost,
      capacity: this.capacity,
      instanceNumber: this.instanceNumber,
      supportedResources: this.supportedResources // Include supportedResources in serialization
    };
  }

  static fromJSON(json) {
    const tool = new Tool(
      json.name, 
      json.buildingType, 
      json.speedBonus, 
      json.cost, 
      json.capacity,
      json.supportedResources // Include supportedResources in deserialization
    );
    tool.instanceNumber = json.instanceNumber; // Include instance number in deserialization
    return tool;
  }
}

// Singleton pattern for tool initialization
const ToolManager = (() => {
  let toolsInitialized = false;
  let tools = [];

  function initializeTools() {
    if (!toolsInitialized) {
      // Specify the capacity and supported resources for each tool
      const tractor = new Tool('Tractor', 'Tool Shed', 1.2, 500, 0); 
      const trimmer = new Tool('Trimmer', 'Tool Shed', 1.1, 300, 0); 
      const forklift = new Tool('Forklift', 'Warehouse', 1.0, 400, 0); 
      const palletJack = new Tool('Pallet Jack', 'Warehouse', 1.0, 150, 0); 
      const harvestbins = new Tool('Harvest Bins', 'Warehouse', 1.0, 1000, 5, ['Grapes']); 
      const fermentationTank = new Tool('Fermentation Tank', 'Warehouse', 1.0, 6000, 2000, ['Must']);
      tools = [tractor, trimmer, forklift, palletJack, harvestbins, fermentationTank];
      toolsInitialized = true;
    }
    return tools;
  }

  // New function to create tool instances based on their name
  function createToolInstance(toolName) {
    const toolTemplate = tools.find(tool => tool.name === toolName);
    if (toolTemplate) {
      return new Tool(toolTemplate.name, toolTemplate.buildingType, 
                       toolTemplate.speedBonus, toolTemplate.cost, 
                       toolTemplate.capacity, 
                       toolTemplate.supportedResources || []); // Add supportedResources if available
    } else {
      console.log('Tool template not found');
      return null; // Handle error gracefully
    }
  }

  return {
    getTools: initializeTools,
    createToolInstance // Expose the function to create tool instances
  };
})();

// Export the more generalized functions
export const getBuildingTools = () => ToolManager.getTools();
export const createTool = (toolName) => ToolManager.createToolInstance(toolName);


export function buildBuilding(buildingName) {
  // Load existing buildings to check if the building already exists
  const buildings = loadBuildings();
  const existingBuilding = buildings.find(b => b.name === buildingName);

  if (existingBuilding) {
    addConsoleMessage(`${buildingName} already exists and cannot be built again.`);
    return;
  }

  // Create and add the new building
  const newBuilding = new Building(buildingName);
  buildings.push(newBuilding);
  
  // Store the updated buildings list
  storeBuildings(buildings);

  // UI feedback
  const buildButton = document.querySelector(`.build-button[data-building-name="${buildingName}"]`);
  const upgradeButton = document.querySelector(`.upgrade-button[data-building-name="${buildingName}"]`);

  if (buildButton && upgradeButton) {
    buildButton.disabled = true;
    buildButton.textContent = "Built";
    upgradeButton.disabled = false; // Enable upgrade now that building is complete
  }

  addConsoleMessage(`${buildingName} has been built successfully.`);
  
  // Update the building cards to reflect the new building
  updateBuildingCards();
}


// Function to upgrade a building including updating eventlisteners
document.addEventListener('DOMContentLoaded', function () {
  updateBuildingCards(); // Update UI when the page is initially loaded
  attachUpgradeButtonListeners(); // Attach listeners to buttons
});

export function updateBuildingCards() {
  document.querySelectorAll('.building-card').forEach(cardDiv => {
    const detailDiv = cardDiv.querySelector('.building-details');
    const buildingName = detailDiv.getAttribute('data-building-name');
    const buildings = loadBuildings();
    const building = buildings.find(b => b.name === buildingName);

    // Update the building name in the card
    const nameDiv = cardDiv.querySelector('.building-name');
    if (nameDiv) {
      nameDiv.textContent = buildingName;
    }

    const status = building ? building.getStatus() : "Unbuilt";
    const level = building ? building.level : 0;
    const capacity = building ? building.capacity : 0;
    const upgradeCost = building ? building.getUpgradeCost() : "N/A";
    const content = building ? building.getContentDescription() : "No items stored.";

    // Apply the unbuilt-card class if status is "Unbuilt"
    if (status === "Unbuilt") {
      cardDiv.classList.add('unbuilt-card');
    } else {
      cardDiv.classList.remove('unbuilt-card');
    }

    detailDiv.innerHTML = `
      <p><strong>${buildingName}</strong></p>  <!-- Add Building Name here -->
      <p>Status: ${status}</p>
      <p>Level: ${level}</p>
      <p>Upgrade Cost: ${upgradeCost}</p>
      <p>Capacity: ${capacity}</p>
      <p>Content: <br> ${content}</p>
    `;

    // Add event listener to open building overlay on card click
    cardDiv.addEventListener('click', () => {
      if (building) {
        showBuildingOverlay(building);
      }
    });
  });
}

function attachUpgradeButtonListeners() {
  document.querySelectorAll('.upgrade-button').forEach(button => {
    button.addEventListener('click', function (event) {
      event.stopPropagation(); // Prevent the click from bubbling up to the card
      const buildingName = this.getAttribute('data-building-name');
      if (buildingName) {
        upgradeBuilding(buildingName);
        updateBuildingCards(); // Ensure cards are updated to reflect the new state
      }
    });
  });
}

export function upgradeBuilding(buildingName) {
  const buildings = loadBuildings();
  const building = buildings.find(b => b.name === buildingName);

  if (!building) {
    console.error(`Building ${buildingName} not found.`);
    return;
  }

  // Calculate and apply upgrade
  const upgradeCost = building.getUpgradeCost();
  building.upgrade();
  
  // Store the updated buildings
  const updatedBuildings = buildings.map(b => b.name === buildingName ? building : b);
  storeBuildings(updatedBuildings);

  // UI feedback
  const upgradeButton = document.querySelector(`.upgrade-button[data-building-name="${buildingName}"]`);
  if (upgradeButton) {
    upgradeButton.disabled = false;
    upgradeButton.textContent = "Upgrade";
  }

  addConsoleMessage(`${buildingName} has been upgraded to level ${building.level}.`);
  
  // Update the building cards to reflect the upgrade
  updateBuildingCards();
}