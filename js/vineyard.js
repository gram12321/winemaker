import { getFlagIcon, formatLandSizeWithUnit } from './utils.js';
import { saveInventory, saveTask, activeTasks } from '/js/database/adminFunctions.js';
import { addConsoleMessage } from '/js/console.js';
import { Task } from './loadPanel.js'; // Import the Task class used for tasks
import { allResources, inventoryInstance } from '/js/resource.js';
import { farmlandYield } from '/js/farmland.js';



export function displayVineyardEntries() {
  const vineyardEntries = document.querySelector('#vineyard-entries');
  vineyardEntries.innerHTML = ''; // Clear existing entries
  const vineyards = JSON.parse(localStorage.getItem('ownedFarmlands')) || []; // Load data

  vineyards.forEach((vineyard, index) => {
    const card = document.createElement('div');
    card.className = 'card';

    const isPlanted = vineyard.plantedResourceName && vineyard.vineAge != null;
    const vineAgeDisplay = isPlanted ? `${vineyard.vineAge} years` : 'Not Planted';
    const statusDisplay = vineyard.plantedResourceName ? vineyard.status || 'Unknown' : 'Not Planted';
    const ripenessDisplay = vineyard.ripeness ? vineyard.ripeness.toFixed(2) : 'N/A'; // Format ripeness to 2 decimals

    // Calculate yield using the getYield function
    const yieldValue = farmlandYield(vineyard);

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
                <th>Ripeness</th> <!-- New Ripeness Column -->
                <th>Yield</th> <!-- New Yield Column -->
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
                <td>${ripenessDisplay}</td> <!-- Display the Ripeness Value -->
                <td>${yieldValue.toFixed(2)}</td> <!-- Display the Yield Value -->
                <td>
                  <button class="btn btn-success harvest-field-btn" ${
                    vineyard.plantedResourceName ? '' : 'disabled'
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
      if (vineyard.plantedResourceName) {
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
      const isTaskAlreadyActive = activeTasks.some(task => task.taskName === "Harvesting" && task.fieldId === index);
      if (!isTaskAlreadyActive && (!field.currentAcresHarvested || field.currentAcresHarvested < totalAcres)) {
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
              fieldName // Pass the field name here
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
              iconPath
          });
          activeTasks.push(task);
          addConsoleMessage(`Harvesting task started for <strong>${task.fieldName}</strong> with <strong>${resourceName}</strong>, Vintage <strong>${gameYear}</strong>.`);
      } else {
          addConsoleMessage(`A Harvesting task is already active or the field is fully harvested for <strong>${field.name || `Field ${index}`}</strong>.`);
      }
  } else {
      addConsoleMessage(`No planted resource found for Field ID ${farmlands[index]?.id || 'unknown'}.`);
  }
}



export function harvestAcres(index) {
    const increment = 10; // Define the increment for harvesting
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const field = farmlands[index];

    if (field && field.plantedResourceName) {
        const resourceName = field.plantedResourceName;
        const state = 'Grapes';
        const gameYear = parseInt(localStorage.getItem('year'), 10);
        const totalAcres = field.acres;

        // Calculate remaining acres to harvest
        let acresLeftToHarvest = totalAcres - (field.currentAcresHarvested || 0);

        if (acresLeftToHarvest > 0) {
            // Rename acresToHarvestNow to acresHarvested
            const acresHarvested = Math.min(increment, acresLeftToHarvest);

            // Calculate the total grapes harvested
            const grapesHarvested = farmlandYield(field) * acresHarvested;

            // Add to the inventory using the inventory instance
            inventoryInstance.addResource(resourceName, grapesHarvested, state, gameYear, 'High');

            // Format the land size with unit settings
            const harvestedFormatted = formatLandSizeWithUnit(acresHarvested);
            const remainingFormatted = formatLandSizeWithUnit(acresLeftToHarvest - acresHarvested);

            addConsoleMessage(`Harvested ${grapesHarvested} tons of ${resourceName} from ${field.name} across ${harvestedFormatted}. Remaining: ${remainingFormatted}`);

            // Update the acres already harvested
            field.currentAcresHarvested = (field.currentAcresHarvested || 0) + acresHarvested;

            // Check if field is completely harvested
            if (field.currentAcresHarvested >= totalAcres) {
                addConsoleMessage(`${field.name} fully harvested`);
                field.currentAcresHarvested = 0;
                field.status = 'Harvested'; // Set the status to Harvested
            }

            // Save inventory and farmland updates
            saveInventory();
            localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));

            return acresHarvested; // Return the increment to update task progress
        } else {
            addConsoleMessage(`Nothing to harvest. ${field.name} is already fully harvested.`);
        }
    } else {
        addConsoleMessage(`Invalid operation. No planted resource found for ${farmlands[index]?.name || 'unknown'}.`);
    }
    return 0; // Default return if no acres were harvested
}