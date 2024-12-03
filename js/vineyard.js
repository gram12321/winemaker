import { getFlagIcon, formatLandSizeWithUnit, formatNumber } from './utils.js';
import { saveInventory, saveTask, activeTasks } from '/js/database/adminFunctions.js';
import { addConsoleMessage } from '/js/console.js';
import { Task } from './loadPanel.js'; // Import the Task class used for tasks
import { inventoryInstance } from '/js/resource.js';
import { farmlandYield } from '/js/farmland.js';
import {calculateWorkApplied } from './staff.js';
import { normalizeAltitude, regionAltitudeRanges } from './names.js'; // Ensure this import is present or add it if missing

import { handleGenericTask } from './administration.js';
import { fieldTaskFunction } from  './farmland.js'

import { showHarvestOverlay } from './overlays/harvestOverlay.js';


export function displayVineyardEntries() {
  const vineyardEntries = document.querySelector('#vineyard-entries');
  vineyardEntries.innerHTML = '';
  const vineyards = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];

  vineyards.forEach((vineyard, index) => {
    const card = document.createElement('div');
    card.className = 'card';

    const isNotPlanted = !vineyard.plantedResourceName || vineyard.plantedResourceName === 'None';
    const vineAgeDisplay = isNotPlanted ? 'Not Planted' : (vineyard.status === 'No yield in first season' ? 'Not Planted or First Season' : `${vineyard.vineAge} years`);
    const statusDisplay = vineyard.plantedResourceName ? vineyard.status || 'Unknown' : 'Not Planted';
    const ripenessDisplay = vineyard.ripeness ? vineyard.ripeness.toFixed(2) : 'N/A';

    const yieldValue = farmlandYield(vineyard);
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
                <th>Expected Yield</th>
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
                  <button class="btn btn-success harvest-field-btn" ${canHarvest ? '' : 'disabled'}>Harvest</button>
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
        showHarvestOverlay(vineyard, index); // Display the overlay
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


        const workApplied = calculateWorkApplied(currentTask.staff || [], 'harvestAcres');
        const acresLeftToHarvest = totalAcres - (field.currentAcresHarvested || 0);

        // Calculate maximum acres that can be harvested based on storage capacity
        const storage = currentTask.storage;

        // Check capacity of the selected storage
        const buildings = JSON.parse(localStorage.getItem('buildings')) || [];
        const buildingContainingTool = buildings.find(building => building.contents.some(content => `${content.name} #${content.instanceNumber}` === storage));
        const tool = buildingContainingTool ? buildingContainingTool.contents.find(content => `${content.name} #${content.instanceNumber}` === storage) : null;

        // Calculate current storage amount
        const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
        const currentStoredAmount = playerInventory
            .filter(item => item.storage === storage)
            .reduce((total, item) => total + item.amount, 0);

        // Calculate space available and maximum acres that can be harvested based on the storage capacity
        const spaceAvailable = tool.capacity - currentStoredAmount;
        const maxAcresByCapacity = Math.floor(spaceAvailable / (farmlandYield(field) * 5)); // Considering the yield per acre
        const acresHarvested = Math.min(workApplied, acresLeftToHarvest, maxAcresByCapacity);

        // Calculate the amount of grapes to store
        const grapesHarvested = farmlandYield(field) * acresHarvested * 5; 
        const grapesToStore = Math.min(grapesHarvested, spaceAvailable); 

        if (grapesToStore <= 0) {
            if (acresLeftToHarvest > 0) {
                addConsoleMessage(`<span style="color:red;">Insufficient capacity in ${storage}, or no staff for Harvesting. Harvested ${acresHarvested} acres, but storage limit reached.</span>`);
            } else {
                addConsoleMessage(`<span style="color:red;">Insufficient capacity in ${storage}. Cannot store any more grapes.</span>`);
            }
            return 0; // No more grapes can be added due to storage limitations
        }

        // Log a warning if we're hitting the capacity limit
        if (grapesToStore === spaceAvailable) {
            addConsoleMessage(`<span style="color:orange;">Warning: Reached storage capacity for ${storage}. Only this amount can be stored.</span>`);
        }

        // Get the altitude range for normalization
        const altitudeRange = regionAltitudeRanges[field.country][field.region];
        const normalizedAltitude = normalizeAltitude(field.altitude, altitudeRange);
        const normalizedDensity = 0.5 + (9000 - (field.density - 1000)) / 18000;
        const quality = ((field.annualQualityFactor + normalizedAltitude + 0.3 + normalizedDensity) / 3).toFixed(2);


      // Call to add the resource to the inventory
      inventoryInstance.addResource(
          resourceName,
          grapesToStore,
          state,
          gameYear,
          quality,
          field.name,
          field.farmlandPrestige,
          storage // Ensure this is the updated storage value
      );

        const harvestedFormatted = `${acresHarvested} acres`;
        const remainingFormatted = `${totalAcres - field.currentAcresHarvested} acres`;

        addConsoleMessage(`Harvested <strong>${formatNumber(grapesToStore)} tons</strong> of ${resourceName} with quality ${quality} from ${field.name} across <strong>${harvestedFormatted}</strong>. Remaining: ${remainingFormatted}`);

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
    } 

    return 0;
}