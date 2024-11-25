import { buildings, storeBuildings } from '/js/database/adminFunctions.js';
import { showBuildingOverlay } from './overlays/buildingOverlay.js'; // Import the showBuildingOverlay function

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

function buildBuilding(name) {
  if (!buildings.find(building => building.name === name)) { // Check if the building is not already built
    const newBuilding = new Building(name, 10); // Customize the capacity further if needed
    buildings.push(newBuilding);
    console.log(`Built a new ${name}:`, newBuilding);

    // Store updated buildings array into localStorage
    storeBuildings(buildings);

    // Update the UI to reflect the new building
    updateBuildingUI(name);
  } else {
    console.log(`Building ${name} already exists.`);
  }
}

function updateBuildingUI(buildingName) {
  const building = buildings.find(b => b.name === buildingName);
  const button = document.querySelector(`.build-button[data-building-name="${buildingName}"]`);
  const buildingCard = button?.previousElementSibling;

  if (buildingCard) {
    buildingCard.querySelector('h4').innerHTML = `
      <div class="icon" style="background-image: url('/assets/icon/menu/${buildingName.toLowerCase().split(' ').join('')}.webp');"></div>
      ${buildingName}  <!-- Always show the building name -->
    `;

    if (building) {
      buildingCard.querySelector('.details').innerHTML = `
        <p>Status: Operational</p>
        <p>Level: ${building.level}</p>
        <p>Upgrade Cost: $10</p> <!-- Dummy value for upgrade cost -->
        <p>Capacity: ${building.capacity}</p>
        <p>Content: ${building.listContents()}</p>
      `;
    } else {
      buildingCard.querySelector('.details').innerHTML = `
        <p>Status: Not Built</p>
        <p>Level: 0</p>
        <p>Upgrade Cost: $10</p> <!-- Dummy value for upgrade cost -->
        <p>Capacity: None</p>
        <p>Content: None</p>
      `;
    }
    buildingCard.classList.toggle('unbuilt-card', !building);
    button.disabled = !!building;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const buildButtons = document.querySelectorAll('.build-button');
  const buildingCards = document.querySelectorAll('.building-card');

  function initializeBuildingCards() {
    buildButtons.forEach(button => {
      const buildingName = button.getAttribute('data-building-name');
      const buildingCard = button.previousElementSibling;

      const buildingExists = buildings.some(building => building.name === buildingName);

      if (buildingExists) {
        buildingCard.classList.remove('unbuilt-card');
        button.disabled = true;
      } else {
        buildingCard.classList.add('unbuilt-card');
        button.disabled = false;
      }
    });
  }

  buildButtons.forEach(button => {
    button.addEventListener('click', function () {
      const buildingName = this.getAttribute('data-building-name');
      buildBuilding(buildingName);
      initializeBuildingCards(); // Re-initialize after building
    });
  });

  buildingCards.forEach(card => {
    card.addEventListener('click', function () {
      const buildingName = card.querySelector('.details h4').textContent;
      const building = buildings.find(b => b.name === buildingName);
      if (building) {
        showBuildingOverlay(building);
      }
    });
  });

  initializeBuildingCards();
});