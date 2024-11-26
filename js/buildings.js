import { buildings, storeBuildings, loadBuildings } from '/js/database/adminFunctions.js';
import { showBuildingOverlay } from './overlays/buildingOverlay.js'; // Import the showBuildingOverlay function
import { addConsoleMessage } from '/js/console.js';

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
    return this.contents.map(item => item.name).join(', ') || "No items stored.";
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

export class Tool {
  constructor(name, buildingType, speedBonus = 1.0) {
    this.name = name;
    this.buildingType = buildingType;
    this.speedBonus = speedBonus;
  }

  toJSON() {
    return {
      name: this.name,
      buildingType: this.buildingType,
      speedBonus: this.speedBonus
    };
  }

  static fromJSON(json) {
    return new Tool(json.name, json.buildingType, json.speedBonus);
  }
}

// Singleton pattern for tool initialization
const ToolManager = (() => {
  let toolsInitialized = false;
  let tools = [];

  function initializeTools() {
    if (!toolsInitialized) {
      const tractor = new Tool('Tractor', 'Tool Shed', 1.2);
      const trimmer = new Tool('Trimmer', 'Tool Shed', 1.1);
      const forklift = new Tool('Forklift', 'Warehouse', 1.0); // Assuming no bonus
      const palletJack = new Tool('Pallet Jack', 'Warehouse', 1.0); // Assuming no bonus
      tools = [tractor, trimmer, forklift, palletJack];
      toolsInitialized = true;
    }
    return tools;
  }

  return {
    getTools: initializeTools
  };
})();
// Export the more generalized function
export const getBuildingTools = () => ToolManager.getTools();


export function buildBuilding(buildingName) {
  // Load existing buildings and check if the building already exists
  const buildings = loadBuildings();
  const existingBuilding = buildings.find(b => b.name === buildingName);

  if (existingBuilding) {
    addConsoleMessage(`${buildingName} already exists and cannot be built again.`);
    return; // Exit the function early if the building exists
  }

  // Create a new building instance if it doesn't exist
  const newBuilding = new Building(buildingName);
  buildings.push(newBuilding);
  storeBuildings(buildings);

  // Handle UI updates directly within the function
  const buildButton = document.querySelector(`.build-button[data-building-name="${buildingName}"]`);
  const upgradeButton = document.querySelector(`.upgrade-button[data-building-name="${buildingName}"]`);

  if (buildButton && upgradeButton) {
    buildButton.disabled = true;
    buildButton.textContent = "Built";
    upgradeButton.disabled = false;

    upgradeButton.addEventListener('click', function () {
      upgradeBuilding(buildingName);
      updateBuildingCards();
    });
  }

  // Console message to indicate the building process is complete
  addConsoleMessage(`${buildingName} has been built successfully!`);

  // Update the building cards
  updateBuildingCards();
}

export function upgradeBuilding(buildingName) {
  const buildings = loadBuildings();
  const building = buildings.find(b => b.name === buildingName);

  if (building) {
    building.upgrade();
    storeBuildings(buildings);
    addConsoleMessage(`${buildingName} upgraded to level ${building.level}!`);
  }
}

// buildings.js
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

    // Apply the unbuilt-card class if status is "Unbuilt"
    if (status === "Unbuilt") {
      cardDiv.classList.add('unbuilt-card');
    } else {
      cardDiv.classList.remove('unbuilt-card');
    }

    detailDiv.innerHTML = `
      <p>Status: ${status}</p>
      <p>Level: ${level}</p>
      <p>Upgrade Cost: ${upgradeCost}</p>
      <p>Capacity: ${capacity}</p>
      <p>Content: ${content}</p>
    `;

    // Add event listener for opening the building overlay
    cardDiv.addEventListener('click', () => {
      if (building) {
        showBuildingOverlay(building);
      }
    });
  });
}