import { getColorClass } from './utils.js';

const grapeCharacteristics = {
    'Barbera': {
        sweetness: 0,      // neutral
        acidity: 0.2,      // high acidity
        tannins: 0.1,      // moderate tannins
        aroma: 0,          // neutral
        body: 0.1,         // moderately full body
        spice: 0           // neutral
    },
    'Pinot Noir': {
        sweetness: 0,      // neutral
        acidity: 0.15,     // moderately high acidity
        tannins: -0.1,     // low tannins
        aroma: 0.1,        // aromatic
        body: -0.15,       // light body
        spice: 0           // neutral
    },
    'Chardonnay': {
        sweetness: 0,      // neutral
        acidity: 0.1,      // moderate acidity
        tannins: -0.15,    // very low tannins
        aroma: 0.15,       // aromatic
        body: 0.05,        // medium body
        spice: 0           // neutral
    },
    'Primitivo': {
        sweetness: 0.2,     // naturally sweet
        acidity: 0,        // neutral
        tannins: 0.2,      // high tannins
        aroma: 0.2,        // very aromatic
        body: 0.2,         // full bodied
        spice: 0           // neutral
    }
};

export class Resource {
    constructor(name, naturalYield, fragile) {
        this.name = name;
        this.naturalYield = naturalYield;
        this.fragile = fragile;

        // Set characteristics from the data structure
        this.wineCharacteristics = grapeCharacteristics[name] || {
            sweetness: 0,
            acidity: 0,
            tannins: 0,
            aroma: 0,
            body: 0,
            spice: 0
        };
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

    // Initialize base characteristics
    this.sweetness = 0.5;
    this.acidity = 0.5;
    this.tannins = 0.5;
    this.aroma = 0.5;
    this.body = 0.5;
    this.spice = 0.5;

    // Apply grape variety characteristics if they exist
    if (resource.wineCharacteristics) {
      this.sweetness += resource.wineCharacteristics.sweetness || 0;
      this.acidity += resource.wineCharacteristics.acidity || 0;
      this.tannins += resource.wineCharacteristics.tannins || 0;
      this.aroma += resource.wineCharacteristics.aroma || 0;
      this.body += resource.wineCharacteristics.body || 0;
      this.spice += resource.wineCharacteristics.spice || 0;
    }
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
  new Resource('Pinot Noir', 0.7, 0.4),
  new Resource('Primitivo', 0.85, 0.8)  // Moderate-high yield, fairly fragile
];

export function getResourceByName(name) {
  const resource = allResources.find(r => r.name === name);
  return resource || null;
}
