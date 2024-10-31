import { getFlagIcon } from './utils.js';
import { saveInventory, saveTask, activeTasks } from '/js/database/adminFunctions.js';
import { addConsoleMessage } from '/js/console.js';
import { Task } from './loadPanel.js'; // Import the Task class used for tasks
import { allResources, inventoryInstance } from '/js/resource.js';


export function displayVineyardEntries() {
  const vineyardEntries = document.querySelector('#vineyard-entries');
  vineyardEntries.innerHTML = ''; // Clear existing entries
  const vineyards = JSON.parse(localStorage.getItem('ownedFarmlands')) || []; // Load data

  vineyards.forEach((vineyard, index) => {
    const card = document.createElement('div');
    card.className = 'card';

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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${vineyard.name}</td>
                <td>${vineyard.acres} Acres</td>
                <td>${vineyard.vineAge == null ? 'Not Planted' : vineyard.vineAge} years</td>
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

    // Harvest Logic
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
            const acresToHarvestNow = Math.min(increment, acresLeftToHarvest);
            // Add to the inventory using the inventory instance
            inventoryInstance.addResource(resourceName, acresToHarvestNow, state, gameYear, 'High');

            addConsoleMessage(`Harvested ${acresToHarvestNow} of ${resourceName} from ${field.name}. Remaining: ${acresLeftToHarvest - acresToHarvestNow}`);

            // Update the acres already harvested
            field.currentAcresHarvested = (field.currentAcresHarvested || 0) + acresToHarvestNow;

            // Check if field is completely harvested
            if (field.currentAcresHarvested >= totalAcres) {
                addConsoleMessage(` ${field.name} fully harvested`);
                field.plantedResourceName = null;
                field.currentAcresHarvested = 0;
            }

            // Save inventory and farmland updates
            saveInventory();
            localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));

            return acresToHarvestNow; // Return the increment to update task progress
        } else {
            addConsoleMessage(`Nothing to harvest.  ${field.name} is already fully harvested.`);
        }
    } else {
        addConsoleMessage(`Invalid operation. No planted resource found for  ${farmlands[index]?.name || 'unknown'}.`);
    }
    return 0; // Default return if no acres were harvested
}