import { getColorClass } from './utils.js';

class Resource {
  constructor(name, naturalYield) {
    this.name = name;
    this.naturalYield = naturalYield;
  }
}

const allResources = [
  new Resource('Barbera', 1),
  new Resource('Chardonnay', 0.9),
  // Add more resources as needed
];

export function getResourceByName(name) {
  return allResources.find(resource => resource.name === name);
}

export { Resource, allResources };