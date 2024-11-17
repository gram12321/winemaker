import { getFlagIcon, formatLandSizeWithUnit, formatNumber } from './utils.js';
import { saveInventory, saveTask, activeTasks } from '/js/database/adminFunctions.js';
import { addConsoleMessage } from '/js/console.js';
import { Task } from './loadPanel.js'; // Import the Task class used for tasks
import { inventoryInstance } from '/js/resource.js';
import { farmlandYield } from '/js/farmland.js';
import {calculateWorkApplied } from './staff.js';

import { handleGenericTask } from './administration.js';
import { fieldTaskFunction } from  './farmland.js'

export function displayVineyardEntries() {
  const vineyardEntries = document.querySelector('#vineyard-entries');
  vineyardEntries.innerHTML = ''; // Clear existing entries
  const vineyards = JSON.parse(localStorage.getItem('ownedFarmlands')) || []; // Load data

  vineyards.forEach((vineyard, index) => {
    const card = document.createElement('div');
    card.className = 'card';

    // Determine vine age display based on status and crop
    const isNotPlanted = !vineyard.plantedResourceName || vineyard.plantedResourceName === 'None';
    const vineAgeDisplay = isNotPlanted ? 'Not Planted' : (vineyard.status === 'No yield in first season' ? 'Not Planted or First Season' : `${vineyard.vineAge} years`);
    const statusDisplay = vineyard.plantedResourceName ? vineyard.status || 'Unknown' : 'Not Planted';
    const ripenessDisplay = vineyard.ripeness ? vineyard.ripeness.toFixed(2) : 'N/A'; // Format ripeness to 2 decimals

    // Calculate yield using the farmlandYield function
    const yieldValue = farmlandYield(vineyard);

    // Check for active tasks on this vineyard field
    const isTaskActiveOnField = activeTasks.some(task => task.fieldId === index);
    const canHarvest = !isTaskActiveOnField && vineyard.status === 'Ready for Harvest';

    card.innerHTML = `
      <div class="card-header" id="heading${index}">
        <h2 class="mb-0">
          <button class="btn btn-link" data-toggle="collapse" data-target="#collapse${index}" aria-expanded="true" aria-controls="collapse${index}">
            ${getFlagIcon(vineyard.country)}
            ${vineyard.country}, ${vineyard.region} - ${vineyard.name}
          </button>
        </h2>
      </div>

      <div id="collapse${index}" class="collapse" aria-labelledby="heading${index}" data-parent="#vineyardAccordion">
        <div class="card-body">
          <table class="table table-bordered vineyard-table">
            <thead>
              <tr>
                <th>Field Name</th>
                <th>Size</th>
                <th>Vine Age</th>
                <th>Crop</th>
                <th>Status</th>
                <th>Ripeness</th>
                <th>Yield</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${vineyard.name}</td>
                <td>${vineyard.acres} Acres</td>
                <td>${vineAgeDisplay}</td>
                <td>${vineyard.plantedResourceName || 'None'}</td>
                <td>${statusDisplay}</td>
                <td>${ripenessDisplay}</td>
                <td>${yieldValue.toFixed(2)}</td>
                <td>
                  <button class="btn btn-success harvest-field-btn" ${
                    canHarvest ? '' : 'disabled'
                  }>Harvest</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    vineyardEntries.appendChild(card);

    const harvestButton = card.querySelector('.harvest-field-btn');
    harvestButton.addEventListener('click', () => {
      if (canHarvest) {
        handleGenericTask('Harvesting', (task, mode) => fieldTaskFunction(task, mode, "Harvesting", { fieldId: index }), { fieldId: index });
      }
    });
  });
}



export function harvestAcres(index) {
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const field = farmlands[index];
    if (field && field.plantedResourceName) {
        const resourceName = field.plantedResourceName;
        const state = 'Grapes';
        const gameYear = parseInt(localStorage.getItem('year'), 10);
        const totalAcres = field.acres;
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const currentTask = tasks.find(task => task.taskName === "Harvesting" && task.fieldId === index);

        if (!currentTask) {
            addConsoleMessage(`No harvesting task found for ${field.name}.`);
            return 0;
        }

        const workApplied = calculateWorkApplied(currentTask.staff || [], 'harvestAcres');

        // Log the work applied for this harvest task
        console.log(`Work applied for harvesting task with ID ${currentTask.taskId}: ${workApplied}`);

        const acresLeftToHarvest = totalAcres - (field.currentAcresHarvested || 0);
        const acresHarvested = Math.min(workApplied, acresLeftToHarvest);

        if (acresHarvested > 0) {
            const grapesHarvested = farmlandYield(field) * acresHarvested * 5;
            const quality = Math.random().toFixed(2); // Random quality placeholder

            // Add the harvested grapes to the inventory, including the field name and prestige
            inventoryInstance.addResource(
                resourceName,
                grapesHarvested,
                state,
                gameYear,
                quality,
                field.name, // Pass the field's name
                field.farmlandPrestige // Pass the field's prestige
            );

            const harvestedFormatted = `${acresHarvested} acres`; 
            const remainingFormatted = `${totalAcres - field.currentAcresHarvested} acres`;

            addConsoleMessage(`Harvested <strong>${formatNumber(grapesHarvested)} tons</strong> of ${resourceName} with quality ${quality} from ${field.name} across <strong>${harvestedFormatted}</strong>. Remaining: ${remainingFormatted}`);

            // Update field's harvested state
            field.currentAcresHarvested = (field.currentAcresHarvested || 0) + acresHarvested;

            if (field.currentAcresHarvested >= totalAcres) {
                addConsoleMessage(`${field.name} fully harvested`);
                field.currentAcresHarvested = 0;
                field.status = 'Harvested';
            }

            // Save updated inventory and farmland status
            saveInventory();
            localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));

            return acresHarvested;
        } else {
            addConsoleMessage(`Nothing to harvest. ${field.name} is already fully harvested.`);
        }
    } else {
        addConsoleMessage(`Invalid operation. No planted resource found for ${farmlands[index]?.name || 'unknown'}.`);
    }
    return 0;
}