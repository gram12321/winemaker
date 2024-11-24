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
  const newBuilding = new Building(name, 10); // Customize the capacity further if needed
  buildings.push(newBuilding);
  console.log(`Built a new ${name}:`, newBuilding);

  // Store updated buildings array into localStorage
  storeBuildings(buildings);

  // Optionally, update the UI to reflect the new building
}

// Event Listener for build buttons
document.addEventListener("DOMContentLoaded", function () {
  const buildButtons = document.querySelectorAll('.build-button');

  buildButtons.forEach(button => {
    button.addEventListener('click', function () {
      const buildingName = this.getAttribute('data-building-name');
      buildBuilding(buildingName);
    });
  });
});