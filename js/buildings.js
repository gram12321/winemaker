// js/buildings.js

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