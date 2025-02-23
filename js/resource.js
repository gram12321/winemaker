import { getColorClass } from './utils.js';

const grapeCharacteristics = {
  'Barbera': {
    acidity: 0.2,      // high acidity
    aroma: 0,          // neutral
    body: 0.1,         // moderately full body
    spice: 0,          // neutral
    sweetness: 0,      // neutral
    tannins: 0.1       // moderate tannins
  },
  'Chardonnay': {
    acidity: -0.1,     // moderate acidity
    aroma: 0.15,       // aromatic
    body: 0.25,        // medium body
    spice: 0.0,        // neutral
    sweetness: 0,      // neutral
    tannins: -0.15     // very low tannins
  },
  'Pinot Noir': {
    acidity: 0.15,     // moderately high acidity
    aroma: 0.1,        // aromatic
    body: -0.15,       // light body
    spice: 0,          // neutral
    sweetness: 0,      // neutral
    tannins: -0.1      // low tannins
  },
  'Primitivo': {
    acidity: 0,        // neutral
    aroma: 0.2,        // very aromatic
    body: 0.2,         // full bodied
    spice: 0,          // neutral
    sweetness: 0.2,    // naturally sweet
    tannins: 0.2       // high tannins
  },
  'Sauvignon Blanc': {    // The issue is here - there's a space in the name
    acidity: 0.3,      
    aroma: 0.25,       
    body: -0.2,        
    spice: 0.1,        
    sweetness: -0.1,   
    tannins: -0.2      
  }
};

export class Resource {
    constructor(name, naturalYield, fragile, proneToOxidation) {
        this.name = name;
        this.naturalYield = naturalYield;
        this.fragile = fragile;
        this.proneToOxidation = proneToOxidation;
        this.wineCharacteristics = grapeCharacteristics[name];
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
    this.oxidation = 0; // Initialize oxidation at 0

    // Add new array for special features
    this.specialFeatures = [];

    // Initialize base characteristics with resource-specific values
    const baseCharacteristics = resource.wineCharacteristics || {
      acidity: 0,
      aroma: 0,
      body: 0,
      spice: 0,
      sweetness: 0,
      tannins: 0
    };

    // Apply base values plus grape characteristics
    this.acidity = 0.5 + (baseCharacteristics.acidity || 0);
    this.aroma = 0.5 + (baseCharacteristics.aroma || 0);
    this.body = 0.5 + (baseCharacteristics.body || 0);
    this.spice = 0.5 + (baseCharacteristics.spice || 0);
    this.sweetness = 0.5 + (baseCharacteristics.sweetness || 0);
    this.tannins = 0.5 + (baseCharacteristics.tannins || 0);

  }

  // Add helper methods for special features
  addSpecialFeature(feature) {
    if (!this.specialFeatures.includes(feature)) {
      this.specialFeatures.push(feature);
    }
  }

  hasSpecialFeature(feature) {
    return this.specialFeatures.includes(feature);
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
    // Ensure we're passing a proper Resource object
    let resourceObj;
    if (typeof resource === 'string') {
      resourceObj = getResourceByName(resource);
    } else if (resource.name) {
      resourceObj = getResourceByName(resource.name);
    }

    if (!resourceObj) {
      console.error('Invalid resource:', resource);
      return null;
    }

    const existingItem = this.findMatchingItem(resourceObj, state, vintage, quality, fieldName, storage);
    
    if (existingItem) {
      existingItem.amount += amount;
      return existingItem;
    } else {
      const newItem = new InventoryItem(resourceObj, amount, state, vintage, quality, fieldName, fieldPrestige, storage);
      this.items.push(newItem);
      return newItem;
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

export const allResources = [ // Resource(name, naturalYield, fragile, proneToOxidation)
  new Resource('Barbera', 1, 1, 0.4),      // Moderately resistant to oxidation
  new Resource('Chardonnay', 0.9, 1, 0.7), // Highly prone to oxidation
  new Resource('Pinot Noir', 0.7, 0.4, 0.8), // Very prone to oxidation
  new Resource('Primitivo', 0.85, 0.8, 0.3),  // More resistant to oxidation
  new Resource('Sauvignon Blanc', 0.95, 0.9, 0.9) // Extremely prone to oxidation
];

export function getResourceByName(name) {
  const resource = allResources.find(r => r.name === name);
  return resource || null;
}
