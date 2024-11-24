// js/buildings.js
import { buildings, storeBuildings } from '/js/database/adminFunctions.js';

export class Building {
  constructor(name, capacity) {
    this.name = name;
    this.capacity = capacity;
    this.contents = [];
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

  upgradeCapacity(increaseBy) {
    this.capacity += increaseBy;
    console.log(`${this.name} upgraded! New capacity is ${this.capacity}.`);
  }

  listContents() {
    return this.contents.map(item => item.name).join(', ') || "No items stored.";
  }

  toJSON() {
    return {
      name: this.name,
      capacity: this.capacity,
      contents: this.contents.map(content => content.toJSON())
    };
  }

  static fromJSON(json) {
    const building = new Building(json.name, json.capacity);
    building.contents = (json.contents || []).map(Tool.fromJSON);
    return building;
  }
}

export class Tool {
  constructor(name) {
    this.name = name;
  }

  toJSON() {
    return { name: this.name };
  }

  static fromJSON(json) {
    return new Tool(json.name);
  }
}

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
  const button = document.querySelector(`.build-button[data-building-name="${buildingName}"]`);
  if (button) {
    const buildingCard = button.previousElementSibling; // Get the building card related to the button
    buildingCard.classList.remove('unbuilt-card'); // Remove the grey out styling
    button.disabled = true; // Disable the build button
  }
}

// Event Listener for build buttons
// js/buildings.js
document.addEventListener("DOMContentLoaded", function () {
  const buildButtons = document.querySelectorAll('.build-button');

  function initializeBuildingCards() {
    buildButtons.forEach(button => {
      const buildingName = button.getAttribute('data-building-name');
      const buildingCard = button.previousElementSibling; // Adjust to select the building card

      if (buildings.find(building => building.name === buildingName)) {
        // If the building is already built, enable the card and disable the button
        buildingCard.classList.remove('unbuilt-card');
        button.disabled = true;
      } else {
        // Ensure the card is greyed out and button is enabled until the building is built
        buildingCard.classList.add('unbuilt-card');
        button.disabled = false;
      }
    });
  }

  buildButtons.forEach(button => {
    button.addEventListener('click', function () {
      const buildingName = this.getAttribute('data-building-name');
      buildBuilding(buildingName);
    });
  });

  initializeBuildingCards(); // Initialize the UI on page load
});