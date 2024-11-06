import { sellWines } from './endDay.js';
import { formatNumber } from './utils.js';

class Resource {
  constructor(name, naturalYield) {
    this.name = name;
    this.naturalYield = naturalYield;
  }
}


const allResources = [
  new Resource('Barbera', 1), // Add naturalYield for each resource
  new Resource('Chardonnay', 0.9),
  // Add more resources as needed
];

export function getResourceByName(name) {
  return allResources.find(resource => resource.name === name);
}

class Inventory {
  constructor() {
    this.items = [];
  }

  addResource(name, amount, state, vintage, quality) {
    const resource = getResourceByName(name);
    if (!resource) {
      throw new Error('Resource not found');
    }

    // Check if the item with these characteristics already exists
    let existingItem = this.items.find(item =>
      item.resource.name === name &&
      item.state === state &&
      item.vintage === vintage &&
      item.quality === quality
    );
    
    if (existingItem) {
      existingItem.amount += amount;
    } else {
      // Add a new item if not found
        this.items.push({
        resource: resource,
        amount: amount,
        state: state,
        vintage: vintage,
        quality: parseFloat(quality) // Ensure quality is stored as a number
      });
    }
  }

  removeResource(name, amount, state, vintage, quality) {
    const itemIndex = this.items.findIndex(item =>
      item.resource.name === name &&
      item.state === state &&
      item.vintage === vintage &&
      item.quality === quality
    );

    if (itemIndex !== -1) {
      const item = this.items[itemIndex];
      if (item.amount > amount) {
        item.amount -= amount;
      } else {
        this.items.splice(itemIndex, 1);
      }
    } else {
      throw new Error('Inventory item not found or insufficient amount');
    }
  }

  getTotalAmount(name, state = null, vintage = null, quality = null) {
    return this.items.reduce((total, item) => {
      if (
        item.resource.name === name &&
        (state === null || item.state === state) &&
        (vintage === null || item.vintage === vintage) &&
        (quality === null || item.quality === quality)
      ) {
        return total + item.amount;
      }
      return total;
    }, 0);
  }
}


function displayInventory(inventory, tablesToShow = ['warehouse-table-body', 'fermentation-table-body', 'winecellar-table-body'], includeSellButton = false) {
    const warehouseTableBody = document.getElementById('warehouse-table-body');
    const fermentationTableBody = document.getElementById('fermentation-table-body');
    const wineCellarTableBody = document.getElementById('winecellar-table-body');

    if (tablesToShow.includes('warehouse-table-body') && warehouseTableBody) {
        warehouseTableBody.innerHTML = '';
    }
    if (tablesToShow.includes('fermentation-table-body') && fermentationTableBody) {
        fermentationTableBody.innerHTML = '';
    }
    if (tablesToShow.includes('winecellar-table-body') && wineCellarTableBody) {
        wineCellarTableBody.innerHTML = '';
    }

    inventory.items.forEach(item => {
        const { resource, amount, state, quality, vintage } = item;

        let tableBodyId;
        let displayAmount = formatNumber(amount);

        if (state === 'Grapes' && tablesToShow.includes('warehouse-table-body')) {
            tableBodyId = 'warehouse-table-body';
            displayAmount += ' t'; // Append 't' for tons to the display amount
        } else if (state === 'Must' && tablesToShow.includes('fermentation-table-body')) {
            tableBodyId = 'fermentation-table-body';
        } else if (state === 'Bottle' && tablesToShow.includes('winecellar-table-body')) {
            tableBodyId = 'winecellar-table-body';
        } else {
            return;
        }

        const inventoryTableBody = document.getElementById(tableBodyId);
        if (inventoryTableBody) {
            const row = document.createElement('tr');

            // Format quality as a percentage
            const formattedQuality = (quality * 100).toFixed(1) + '%';

            row.innerHTML = `
                <td>${resource.name}, ${vintage || 'Unknown'}</td>
                <td>${displayAmount}</td>
                <td>${formattedQuality}</td>
                <td>${state.charAt(0).toUpperCase() + state.slice(1)}</td>
                ${includeSellButton ? `<td><button class="btn btn-success sell-btn">Sell</button></td>` : ''}
            `;
            inventoryTableBody.appendChild(row);

            // Add event listener to sell button if it exists
            if (includeSellButton) {
                const sellButton = row.querySelector('.sell-btn');
                sellButton.addEventListener('click', () => {
                    sellWines(resource.name);
                });
            }
        }
    });
}

// Inventory instance
const inventoryInstance = new Inventory();

export { Resource, Inventory, displayInventory, allResources, inventoryInstance };