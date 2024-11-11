import { getFlagIcon, formatLandSizeWithUnit, formatNumber, calculateWorkApplied } from './utils.js';
import { saveInventory, saveTask, activeTasks } from '/js/database/adminFunctions.js';
import { addConsoleMessage } from '/js/console.js';
import { Task } from './loadPanel.js'; // Import the Task class used for tasks
import { inventoryInstance } from '/js/resource.js';
import { farmlandYield } from '/js/farmland.js';

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
        handleHarvestTask(index);
      }
    });
  });
}

export function handleHarvestTask(index) {
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const field = farmlands[index];

    if (field && field.plantedResourceName) {
        const resourceName = field.plantedResourceName;
        const state = 'Grapes';
        const gameYear = parseInt(localStorage.getItem('year'), 10);
        const totalAcres = field.acres;
        const fieldName = field.name || `Field ${index}`;

        // Check if any task is already active on this field
        const isAnyTaskActiveOnField = activeTasks.some(task => task.fieldId === index);

        if (!isAnyTaskActiveOnField && (!field.currentAcresHarvested || field.currentAcresHarvested < totalAcres)) {
            const iconPath = '/assets/icon/icon_harvesting.webp'; // Define the icon path for harvesting
            const task = new Task(
                "Harvesting",
                () => harvestAcres(index),
                undefined,
                totalAcres,
                resourceName,
                state,
                gameYear,
                'High', // Use arbitrary quality
                iconPath,
                fieldName,
                'Field'  // Specify the type of the task
            );

            // Include fieldName in Object.assign
            Object.assign(task, { fieldId: index, fieldName });

            saveTask({
                taskName: task.taskName,
                fieldId: index,
                fieldName: task.fieldName,
                resourceName,
                taskId: task.taskId,
                workTotal: totalAcres,
                vintage: gameYear,
                iconPath,
                type: 'Field', // Explicitly pass in type
                staff: task.staff
            });

            activeTasks.push(task);
            addConsoleMessage(`Harvesting task started for <strong>${task.fieldName}</strong> with <strong>${resourceName}</strong>, Vintage <strong>${gameYear}</strong>.`);
        } else {
            const message = isAnyTaskActiveOnField 
                ? `Another task is already active on field <strong>${fieldName}</strong>.`
                : `A Harvesting task is already active or the field is fully harvested for <strong>${field.name || `Field ${index}`}</strong>.`;
            addConsoleMessage(message);
        }
    } else {
        addConsoleMessage(`No planted resource found for Field ID ${farmlands[index]?.id || 'unknown'}.`);
    }
}

export function harvestAcres(index) {
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const field = farmlands[index];

    if (field && field.plantedResourceName) {
        console.log('Field Name:', field.name); // Log to verify field name is being retrieved
        const resourceName = field.plantedResourceName;
        const state = 'Grapes';
        const gameYear = parseInt(localStorage.getItem('year'), 10);
        const totalAcres = field.acres;
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const currentTask = tasks.find(task => task.taskName === "Harvesting" && task.fieldId === index);

        const workApplied = calculateWorkApplied(currentTask?.staff || []);
        let acresLeftToHarvest = totalAcres - (field.currentAcresHarvested || 0);
        const acresHarvested = Math.min(workApplied, acresLeftToHarvest);

        if (acresHarvested > 0) {
            const grapesHarvested = farmlandYield(field) * acresHarvested * 5;
            const quality = Math.random().toFixed(2); // Random quality placeholder

            console.log('Adding resource with field name:', field.name); // Log before adding resource
            // Add the harvested grapes to the inventory, including the field name
            inventoryInstance.addResource(
                resourceName,
                grapesHarvested,
                state,
                gameYear,
                quality,
                field.name // Pass the field's name to the addResource method
            );

            const harvestedFormatted = `${acresHarvested} acres`; // Format harvested info
            const remainingFormatted = `${totalAcres - field.currentAcresHarvested} acres`; // Format remaining info

            addConsoleMessage(`Harvested <strong>${formatNumber(grapesHarvested)} tons</strong> of ${resourceName} with quality ${quality} from ${field.name} across <strong>${harvestedFormatted}</strong>. Remaining: ${remainingFormatted}`);

            field.currentAcresHarvested = (field.currentAcresHarvested || 0) + acresHarvested;

            if (field.currentAcresHarvested >= totalAcres) {
                addConsoleMessage(`${field.name} fully harvested`);
                field.currentAcresHarvested = 0;
                field.status = 'Harvested';
            }

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