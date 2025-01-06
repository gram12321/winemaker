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


        const resource = getResourceByName(name);


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
            // Add container and capacity info for fermentation tanks
            const buildings = JSON.parse(localStorage.getItem('buildings')) || [];
            const building = buildings.find(b => b.contents.some(t => t.name === 'Fermentation Tank' && `${t.name} #${t.instanceNumber}` === item.storage));
            const tool = building?.contents.find(t => `${t.name} #${t.instanceNumber}` === item.storage);
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

            if (state === 'Must') {
                row.innerHTML = `
                    <td>${item.storage || 'N/A'}</td>
                    <td>${tool ? tool.capacity : 'N/A'}</td>
                    <td><strong>${fieldName}</strong>, ${resource.name}, ${vintage || 'Unknown'}</td>
                    <td>${displayAmount}</td>
                    <td>${qualityText}</td>
                    <td><img src="${statusIconPath}" alt="${state}" class="status-image"></td>
                    ${includeSellButton ? `<td><button class="btn btn-success sell-btn">Sell</button></td>` : ''}
                `;
            } else {
                row.innerHTML = `
                    <td><strong>${fieldName}</strong>, ${resource.name}, ${vintage || 'Unknown'}</td>
                    <td>${displayAmount}</td>
                    <td>${qualityText}</td>
                    <td><img src="${statusIconPath}" alt="${state}" class="status-image"></td>
                    ${includeSellButton ? `<td><button class="btn btn-success sell-btn">Sell</button></td>` : ''}
                `;
            }
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

  storageTableBody.innerHTML = '';

  buildings.forEach(building => {
    building.contents.forEach(tool => {
      if (tool.supportedResources?.includes('Grapes')) {
        const row = document.createElement('tr');
        const matchingInventoryItems = playerInventory.filter(item => 
          item.storage === `${tool.name} #${tool.instanceNumber}` &&
          item.state === 'Grapes'
        );
        const firstItem = matchingInventoryItems[0];

        if (excludeQualityAndStatus) {
          const selectCell = document.createElement('td');
          const radioInput = document.createElement('input');
          radioInput.type = 'radio';
          radioInput.name = 'tool-select';
          radioInput.value = `${tool.name} #${tool.instanceNumber}`;
          selectCell.appendChild(radioInput);
          row.appendChild(selectCell);
        }

        row.innerHTML += `
          <td>${tool.name} #${tool.instanceNumber}</td>
          <td>${tool.capacity}</td>
          <td>${firstItem ? `<strong>${firstItem.fieldName}</strong>, ${firstItem.resource.name}, ${firstItem.vintage || 'Unknown'}` : 'N/A'}</td>
          <td>${formatNumber(matchingInventoryItems.reduce((sum, item) => sum + item.amount, 0))} t</td>
        `;

        if (!excludeQualityAndStatus) {
          if (firstItem?.quality) {
            const qualityDescription = getWineQualityCategory(firstItem.quality);
            const colorClass = getColorClass(firstItem.quality);
            row.innerHTML += `
              <td>${qualityDescription} <span class="${colorClass}">(${firstItem.quality.toFixed(2)})</span></td>
            `;
          } else {
            row.innerHTML += '<td>N/A</td>';
          }

          if (firstItem?.state) {
            row.innerHTML += `
              <td><img src="/assets/pic/${firstItem.state.toLowerCase()}_dalle.webp" alt="${firstItem.state}" class="status-image"></td>
            `;
          } else {
            row.innerHTML += '<td>N/A</td>';
          }
        }

        storageTableBody.appendChild(row);
      }
    });
  });
}

// Inventory instance
const inventoryInstance = new Inventory();

export { Resource, Inventory, displayInventory, allResources, inventoryInstance };