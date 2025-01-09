import { getColorClass } from './utils.js';

export class Resource {
  constructor(name, naturalYield) {
    this.name = name;
    this.naturalYield = naturalYield;
  }
}

export class InventoryItem {
  constructor(resource, amount, state, vintage, quality, fieldName, fieldPrestige, storage) {
    this.resource = resource;
    this.amount = amount;
    this.state = state;
    this.vintage = vintage;
    this.quality = quality;
    this.fieldName = fieldName;
    this.fieldPrestige = fieldPrestige;
    this.storage = storage;
  }

  getBottleInfo() {
    return {
      name: `${this.fieldName}, ${this.resource.name}, ${this.vintage}`,
      quality: this.quality,
      amount: this.amount,
      storage: this.storage
    };
  }
}

export class Inventory {
  constructor() {
    this.items = [];
  }

  getBottledWines() {
    return this.items
      .filter(item => item.state === 'Bottles')
      .map(item => item.getBottleInfo());
  }

  getBottledWineByResource(resourceName) {
    const wine = this.items.find(item => 
      item.resource.name === resourceName && 
      item.state === 'Bottles'
    );
    return wine ? wine.getBottleInfo() : null;
  }

  addResource(resource, amount, state, vintage, quality, fieldName, fieldPrestige, storage) {
    const existingItem = this.items.find(item => 
      item.resource.name === resource.name &&
      item.state === state &&
      item.vintage === vintage &&
      item.quality === quality &&
      item.fieldName === fieldName &&
      item.storage === storage
    );

    if (existingItem) {
      existingItem.amount += amount;
    } else {
      this.items.push(new InventoryItem(resource, amount, state, vintage, quality, fieldName, fieldPrestige, storage));
    }
  }

  removeResource(resource, amount, state, vintage, storage) {
    const itemIndex = this.items.findIndex(item =>
      item.resource.name === resource.name &&
      item.state === state &&
      item.vintage === vintage &&
      item.storage === storage
    );

    if (itemIndex === -1) return false;

    const item = this.items[itemIndex];
    if (item.amount < amount) return false;

    item.amount -= amount;
    if (item.amount === 0) {
      this.items.splice(itemIndex, 1);
    }
    return true;
  }

  getStorageContents(storageId) {
    return this.items.filter(item => item.storage === storageId);
  }

  getItemsByState(state) {
    return this.items.filter(item => item.state === state);
  }

  save() {
    localStorage.setItem('playerInventory', JSON.stringify(this.items));
  }

  load() {
    const savedData = localStorage.getItem('playerInventory');
    if (savedData) {
      this.items = JSON.parse(savedData);
    }
  }
}

export const inventoryInstance = new Inventory();

export const allResources = [
  new Resource('Barbera', 1),
  new Resource('Chardonnay', 0.9)
];

export function getResourceByName(name) {
  return allResources.find(resource => resource.name === name);
}