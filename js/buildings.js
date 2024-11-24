// buildings.js

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

// Save buildings to localStorage
export function saveBuildingsToLocalStorage(buildings) {
  const serializedBuildings = buildings.map(building => building.toJSON());
  localStorage.setItem('buildings', JSON.stringify(serializedBuildings));
}

// Load buildings from localStorage
export function loadBuildingsFromLocalStorage() {
  const serializedBuildings = JSON.parse(localStorage.getItem('buildings') || '[]');
  return serializedBuildings.map(Building.fromJSON);
}

let builtBuildings = {
  toolShed: null,
  warehouse: null
};

export function buildToolShed() {
  if (!builtBuildings.toolShed) {
    builtBuildings.toolShed = new Building('Tool Shed', 10);
    console.log('Tool Shed built!');
    updateUI();
  } else {
    console.log('Tool Shed has already been built!');
  }
}

function updateUI() {
  const toolShedCard = document.getElementById('tool-shed-card');
  if (builtBuildings.toolShed) {
    toolShedCard.classList.remove('unbuilt-card');
    toolShedCard.querySelector('.btn').disabled = true;
    toolShedCard.addEventListener('click', () => {
      import('./overlays/buildingOverlay.js').then(module => {
        module.showBuildingOverlay('Tool Shed');
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  updateUI(); // Ensure UI is updated on page load
});