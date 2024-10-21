class Resource {
  constructor(name, category, state) {
    this.name = name;
    this.category = category; // Determines the inventory location
    this.state = state; // Describes the current state of the resource
  }
}

class Inventory {
  constructor() {
    this.resources = {};
  }

  addResource(resource, amount = 0) {
    this.resources[resource.name] = (this.resources[resource.name] || 0) + amount;
  }

  getResourceAmount(name) {
    return this.resources[name] || 0;
  }

  setResourceAmount(name, amount) {
    this.resources[name] = amount;
  }
}

function displayInventory(inventory) {
  for (const [name, amount] of Object.entries(inventory.resources)) {
    const resource = allResources.find((r) => r.name === name);
    if (resource) {
      const tableBodyId = `${resource.category}-table-body`; // Use category to build the ID
      const inventoryTableBody = document.getElementById(tableBodyId);

      if (inventoryTableBody) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${name}</td><td>${amount}</td><td>${resource.state}</td>`;
        inventoryTableBody.appendChild(row);
      }
    }
  }
}

// Define resource names for use in resource creation
const resourceNames = ['Barbera', 'Chardonnay']; // Add more as needed

// Placeholder for dynamically created resources
const allResources = [];

// Initialize resources and add them to allResources
resourceNames.forEach(name => {
  // Initialize each resource with a suitable default category and state
  const resource = new Resource(name, 'warehouse', 'Grapes');
  allResources.push(resource);
});



// Create player inventory
const playerInventory = new Inventory();
const savedResources = JSON.parse(localStorage.getItem('playerInventory')) || {};
for (const [name, amount] of Object.entries(savedResources)) {
  playerInventory.addResource(new Resource(name, 'warehouse', 'Grapes'), amount);
}

// Utility function to create resources dynamically during harvesting
function createResource(name, category, state) {
  const resource = new Resource(name, category, state);
  allResources.push(resource);
  return resource;
}

// Export necessary entities
export { Resource, Inventory, displayInventory, playerInventory, createResource, allResources };