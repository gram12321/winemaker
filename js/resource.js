import { getColorClass } from './utils.js';

export class Resource {
  constructor(name, naturalYield, fragile) {
    this.name = name;
    this.naturalYield = naturalYield;
    this.fragile = fragile;
  }
}

export class InventoryItem {
  constructor(resource, amount, state, vintage, quality, fieldName, fieldPrestige, storage) {
    this.resource = resource;
    this.amount = amount;
    this.state = state;
    this.vintage = vintage;
    this.quality = quality || 0;
    this.fieldName = fieldName;
    this.fieldPrestige = fieldPrestige;
    this.storage = storage;
  }

  getDisplayInfo() {
    return {
      name: `${this.fieldName}, ${this.resource.name}, ${this.vintage}`,
      quality: this.quality,
      amount: this.amount,
      storage: this.storage,
      fieldName: this.fieldName,
      resource: this.resource,
      vintage: this.vintage,
      fieldPrestige: this.fieldPrestige,
      state: this.state
    };
  }

  getQualityDisplay() {
    return this.quality ? 
      `<span class="${getColorClass(this.quality)}">${(this.quality * 100).toFixed(0)}%</span>` : 
      'N/A';
  }
}

export class Inventory {
  constructor() {
    this.items = [];
  }

  getItemsByState(state) {
    return this.items.filter(item => item.state === state);
  }

  getStorageContents(storageId) {
    if (!storageId) return [];
    return this.items.filter(item => item.storage === storageId);
  }

  addResource(resource, amount, state, vintage, quality, fieldName, fieldPrestige, storage) {
    const existingItem = this.findMatchingItem(resource, state, vintage, quality, fieldName, storage);
    
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

  getResourceAmount(resource, state, vintage, storage) {
    const matchingItems = this.items.filter(item => 
      item.resource.name === resource.name &&
      item.state === state &&
      item.vintage === vintage &&
      item.storage === storage
    );
    return matchingItems.reduce((sum, item) => sum + item.amount, 0);
  }

  findMatchingItem(resource, state, vintage, quality, fieldName, storage) {
    return this.items.find(item => 
      item.resource.name === resource.name &&
      item.state === state &&
      item.vintage === vintage &&
      item.quality === quality &&
      item.fieldName === fieldName &&
      item.storage === storage
    );
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

export const allResources = [ // Resource(name, naturalYield, fragile)
  new Resource('Barbera', 1, 1),
  new Resource('Chardonnay', 0.9, 1),
  new Resource('Pinot Noir', 0.7, 0.4)
];

export function getResourceByName(name) {
  return allResources.find(resource => resource.name === name);
}
