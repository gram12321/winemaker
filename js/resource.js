class Resource {
  constructor(name, category, state) {
    this.name = name;
    this.category = category; // Determines the inventory location
    this.state = state; // Describes the current state of the resource
  }
}

class Inventory {
  // Use static property to store resources
  static resources = {};

  static addResource(resource, amount = 0) {
    this.resources[resource.name] = (this.resources[resource.name] || 0) + amount;
  }

  static getResourceAmount(name) {
    return this.resources[name] || 0;
  }

  static setResourceAmount(name, amount) {
    this.resources[name] = amount;
  }
}

function displayInventory() {
  for (const [name, amount] of Object.entries(Inventory.resources)) { // Reference static property
    const resource = allResources.find((r) => r.name === name);
    if (resource) {
      const tableBodyId = `${resource.category}-table-body`;
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

// Initialize player inventory from localStorage
const savedResources = JSON.parse(localStorage.getItem('playerInventory')) || {};
for (const [name, amount] of Object.entries(savedResources)) {
  Inventory.addResource(new Resource(name, 'warehouse', 'Grapes'), amount); // Use static method
}



// Export necessary entities
export { Resource, Inventory, displayInventory, allResources };