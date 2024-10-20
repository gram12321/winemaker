class Resource {
  constructor(name) {
    this.name = name;
  }
}

class Inventory {
  constructor() {
    this.resources = {};
  }

  addResource(resource, amount = 0) {
    if (!this.resources[resource.name]) {
      this.resources[resource.name] = 0;
    }
    this.resources[resource.name] += amount;
  }

  getResourceAmount(name) {
    return this.resources[name] || 0;
  }

  setResourceAmount(name, amount) {
    this.resources[name] = amount;
  }
}

function displayInventory(inventory) {
  const inventoryTableBody = document.getElementById('inventory-table-body');
  inventoryTableBody.innerHTML = ''; // Clear existing content
  for (const [name, amount] of Object.entries(inventory.resources)) {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${name}</td><td>${amount}</td>`;
    inventoryTableBody.appendChild(row);
  }
}

// Instantiate resources
const barbera = new Resource('Barbera');
const chardonnay = new Resource('Chardonnay');
const allResources = [barbera, chardonnay]; // List of all resources

// Create player inventory
const playerInventory = new Inventory();
playerInventory.addResource(barbera, 5); // Sample inventory data


// Export necessary entities
export { Resource, Inventory, displayInventory, playerInventory, allResources };