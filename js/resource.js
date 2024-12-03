import { sellWines } from './sales.js';
import { formatNumber, getWineQualityCategory, getColorClass  } from './utils.js';

// Add this at the end of resource.js

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

    addResource(name, amount, state, vintage, quality, fieldName, fieldPrestige, storage) {
        console.log(`Adding resource: ${name}, Amount: ${amount}, State: ${state}, Vintage: ${vintage}, Quality: ${quality}, Field Name: ${fieldName}, Field Prestige: ${fieldPrestige}, Storage: ${storage}`);

        const resource = getResourceByName(name);
        if (!resource) {
            throw new Error('Resource not found');
        }

        // Check if the item with these characteristics already exists
        let existingItem = this.items.find(item =>
            item.resource.name === name &&
            item.state === state &&
            item.vintage === vintage &&
            item.quality === parseFloat(quality) &&
            item.fieldName === fieldName &&
            item.fieldPrestige === fieldPrestige &&
            item.storage === storage                               
        );

        if (existingItem) {
            // If the resource exists, only update the amount
            existingItem.amount += amount;
        } else {
            // If it's a new resource, add it with the specified storage
            this.items.push({
                resource: resource,
                amount: amount,
                state: state,
                vintage: vintage,
                quality: parseFloat(quality),
                fieldName: fieldName,
                fieldPrestige: fieldPrestige,
                storage: storage // New resource goes into the specified storage
            });
        }

        // Log the current state of the inventory
        console.log(`Current Inventory:`, this.items);
    }

  removeResource(name, amount, state, vintage, quality, fieldName, fieldPrestige) { // Include fieldPrestige
    const itemIndex = this.items.findIndex(item =>
      item.resource.name === name &&
      item.state === state &&
      item.vintage === vintage &&
      item.quality === parseFloat(quality) &&
      item.fieldName === fieldName &&
      item.fieldPrestige === fieldPrestige // Match the fieldPrestige as well
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

  getTotalAmount(name, state = null, vintage = null, quality = null, fieldName = null, fieldPrestige = null) { // Include fieldPrestige
    return this.items.reduce((total, item) => {
      if (
        item.resource.name === name &&
        (state === null || item.state === state) &&
        (vintage === null || item.vintage === vintage) &&
        (quality === null || item.quality === parseFloat(quality)) &&
        (fieldName === null || item.fieldName === fieldName) &&
        (fieldPrestige === null || item.fieldPrestige === fieldPrestige) // Match the fieldPrestige if provided
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
        const { resource, amount, state, quality, vintage, fieldName } = item;

        let tableBodyId;
        let displayAmount = formatNumber(amount);
        let statusIconPath;

        if (state === 'Grapes' && tablesToShow.includes('warehouse-table-body')) {
            tableBodyId = 'warehouse-table-body';
            displayAmount += ' t';
            statusIconPath = '/assets/pic/grapes_dalle.webp';
        } else if (state === 'Must' && tablesToShow.includes('fermentation-table-body')) {
            tableBodyId = 'fermentation-table-body';
          displayAmount += ' l';
            statusIconPath = '/assets/pic/must_dalle.webp';
        } else if (state === 'Bottle' && tablesToShow.includes('winecellar-table-body')) {
            tableBodyId = 'winecellar-table-body';
          displayAmount += ' bottles';
            statusIconPath = '/assets/pic/bottles_dalle.webp';
        } else {
            return;
        }

        const inventoryTableBody = document.getElementById(tableBodyId);
        if (inventoryTableBody) {
            const row = document.createElement('tr');

            const qualityDescription = getWineQualityCategory(quality);
            const colorClass = getColorClass(quality);

            const qualityText = `${qualityDescription} <span class="${colorClass}">(${quality.toFixed(2)})</span>`;

            row.innerHTML = `
                <td><strong>${fieldName}</strong>, ${resource.name}, ${vintage || 'Unknown'}</td>
                <td>${displayAmount}</td>
                <td>${qualityText}</td>
                <td><img src="${statusIconPath}" alt="${state}" class="status-image"></td>
                ${includeSellButton ? `<td><button class="btn btn-success sell-btn">Sell</button></td>` : ''}
            `;
            inventoryTableBody.appendChild(row);

            if (includeSellButton) {
                const sellButton = row.querySelector('.sell-btn');
                sellButton.addEventListener('click', () => {
                    sellWines(resource.name);
                });
            }
        }
    });
}

export function populateStorageTable(storageTableBodyId, excludeQualityAndStatus = false) {
  const storageTableBody = document.getElementById(storageTableBodyId);

  const buildings = JSON.parse(localStorage.getItem('buildings')) || [];
  const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];

  storageTableBody.innerHTML = ''; // Clear existing table content

  buildings.forEach((building) => {
    building.contents.forEach((tool) => {
      if (tool.capacity > 0) {
        const row = document.createElement('tr');

        // Create if not excluding Quality and Status
        if (excludeQualityAndStatus) {
          const selectCell = document.createElement('td');
          const radioInput = document.createElement('input');
          radioInput.type = 'radio';
          radioInput.name = 'tool-select'; // Grouping the radio buttons
          radioInput.value = `${tool.name} #${tool.instanceNumber}`; // Set value to the tool instance

          selectCell.appendChild(radioInput);
          row.appendChild(selectCell);
        } else {
          // If excluding Quality and Status, add a placeholder cell

        }

        // Display the unique name of the tool instance
        const containerCell = document.createElement('td');
        containerCell.textContent = `${tool.name} #${tool.instanceNumber}`;
        row.appendChild(containerCell);

        // Display the tool capacity
        const capacityCell = document.createElement('td');
        capacityCell.textContent = tool.capacity;
        row.appendChild(capacityCell);

        // Filter for matching inventory items for this specific tool instance
        const matchingInventoryItems = playerInventory.filter(item => item.storage === `${tool.name} #${tool.instanceNumber}`);

        // Preparing the resource details for the row
        const resourceCell = document.createElement('td');
        if (matchingInventoryItems.length > 0) {
          const { resource, fieldName, vintage } = matchingInventoryItems[0];
          resourceCell.innerHTML = `<strong>${fieldName}</strong>, ${resource.name}, ${vintage || 'Unknown'}`;
        } else {
          resourceCell.textContent = 'N/A'; // Display N/A if no items are found
        }
        row.appendChild(resourceCell); // Correct placement of "resource"

        // Amount cell
        const amountCell = document.createElement('td');
        const totalAmount = matchingInventoryItems.reduce((sum, item) => sum + item.amount, 0) || 0;
        amountCell.textContent = `${formatNumber(totalAmount)} t`; // Display the total amount
        row.appendChild(amountCell); // Correct placement of "amount"

        // Check if quality and status should be included
        if (!excludeQualityAndStatus) {
          const qualityCell = document.createElement('td');
          if (matchingInventoryItems.length > 0) {
            const { quality } = matchingInventoryItems[0];
            const qualityDescription = getWineQualityCategory(quality);
            const colorClass = getColorClass(quality);
            qualityCell.innerHTML = `${qualityDescription} <span class="${colorClass}">(${quality.toFixed(2)})</span>`;
          } else {
            qualityCell.textContent = 'N/A'; 
          }
          row.appendChild(qualityCell);

          const statusCell = document.createElement('td');
          if (matchingInventoryItems.length > 0) {
            const statusIconPath = `/assets/pic/${matchingInventoryItems[0].state.toLowerCase()}_dalle.webp`;
            statusCell.innerHTML = `<img src="${statusIconPath}" alt="${matchingInventoryItems[0].state}" class="status-image">`;
          } else {
            statusCell.textContent = 'N/A'; 
          }
          row.appendChild(statusCell);
        }

        // Append the constructed row to the storage table body
        storageTableBody.appendChild(row);
      }
    });
  });
}

// Inventory instance
const inventoryInstance = new Inventory();

export { Resource, Inventory, displayInventory, allResources, inventoryInstance };