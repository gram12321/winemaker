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



// Function to handle building construction
export function buildBuilding(buildingName) {
  // Create a new building instance
  const newBuilding = new Building(buildingName);

  // Load existing buildings, add the new building, and store back
  const buildings = loadBuildings();
  buildings.push(newBuilding);
  storeBuildings(buildings);

  // Console message or update UI accordingly
  addConsoleMessage(`${buildingName} has been built successfully!`);
}



export function updateBuildingCards() {
  document.querySelectorAll('.building-details').forEach(detailDiv => {
    const buildingName = detailDiv.getAttribute('data-building-name');
    const buildings = loadBuildings();
    const building = buildings.find(b => b.name === buildingName);

    const status = building ? building.getStatus() : "Unbuilt";
    const level = building ? building.level : 0;
    const capacity = building ? building.capacity : 0;
    const upgradeCost = building ? building.getUpgradeCost() : "N/A";
    const content = building ? building.getContentDescription() : "No items stored.";

    detailDiv.innerHTML = `
      <p>Status: ${status}</p>
      <p>Level: ${level}</p>
      <p>Upgrade Cost: ${upgradeCost}</p>
      <p>Capacity: ${capacity}</p>
      <p>Content: ${content}</p>
    `;
  });
}