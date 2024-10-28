import { addConsoleMessage, getIconHtml } from '/js/console.js';
import { italianMaleNames, italianFemaleNames } from '/js/names.js'; // Import names
import { allResources, inventoryInstance } from '/js/resource.js';
import { saveInventory, saveTask, activeTasks } from '/js/database/adminFunctions.js';
import { Task } from './loadPanel.js'; // Import the Task class used for tasks
import { getFlagIcon } from './utils.js';

class Farmland {
  constructor(id, name, country, region, acres, plantedResourceName = null, vineAge = '', grape = '', soil = '', altitude = '', aspect = '', density = '') {
    this.id = id;
    this.name = name;
    this.country = country;
    this.region = region;
    this.acres = acres;
    this.plantedResourceName = plantedResourceName;
    this.vineAge = vineAge; // Initially empty
    this.soil = soil;
    this.altitude = altitude;
    this.aspect = aspect;
    this.density = density;
  }
}
function createFarmland(id, name, country, region, acres) {
  // New attributes are retained but default values are kept empty for now
  return new Farmland(id, name, country, region, acres);
}
export function getLastId(farmlands) {
  if (farmlands.length === 0) return 0;
  return Math.max(...farmlands.map(farmland => farmland.id));
}
export function getRandomName() {
  const allNames = italianMaleNames.concat(italianFemaleNames);
  return allNames[Math.floor(Math.random() * allNames.length)];
}
function buyLand() {
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  const newId = getLastId(farmlands) + 1;
  const newName = getRandomName();
  const newFarmland = createFarmland(newId, newName, "Italy", "Piedmont", 100);
  farmlands.push(newFarmland);
  localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
  addConsoleMessage(`Purchased new farmland: "<strong>${newFarmland.name}</strong>" in <strong>${newFarmland.country}, ${newFarmland.region}</strong>, with total <strong>${newFarmland.acres} </strong>Acres`);
  displayOwnedFarmland();
}



function displayOwnedFarmland() {
  const farmlandEntries = document.querySelector('#farmland-entries');
  farmlandEntries.innerHTML = ''; // Clear existing entries
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  // Create options for each available resource
  const resourceOptions = allResources.map(resource => `<option value="${resource.name}">${resource.name}</option>`).join('');
  farmlands.forEach((farmland, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header" id="heading${index}">
        <h2 class="mb-0">
          <button class="btn btn-link" data-toggle="collapse" data-target="#collapse${index}" aria-expanded="true" aria-controls="collapse${index}">
            ${getFlagIcon(farmland.country)}
            ${farmland.country}, ${farmland.region} - ${farmland.name}
          </button>
        </h2>
      </div>
      <div id="collapse${index}" class="collapse" aria-labelledby="heading${index}" data-parent="#farmlandAccordion">
        <div class="card-body">
          <table class="table table-bordered owned-farmland-table">
            <thead>
              <tr>
                <th>Field Name</th>
                <th>Size</th>
                <th>Planted</th>
                <th>Planting Options</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${farmland.name}</td>
                <td>${farmland.acres} Acres</td>
                <td>${farmland.plantedResourceName || 'Empty'}</td>
                <td>
                  <select class="resource-select">
                    ${resourceOptions}
                  </select>
                </td>
                <td>
                  <button class="btn btn-warning plant-field-btn">Plant</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    farmlandEntries.appendChild(card);
    // Planting Logic
    const plantButton = card.querySelector('.plant-field-btn');
    plantButton.addEventListener('click', () => {
      const resourceSelect = card.querySelector('.resource-select');
      const selectedResource = resourceSelect.value;
      handlePlantingTask(index, selectedResource, farmland.acres);
    });
  });
}

function handlePlantingTask(index, resourceName, totalAcres) {
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const field = farmlands[index] || {};
    const fieldName = field.name || `Field ${index}`;
    const fieldRegion = field.region || '';
    const gameYear = localStorage.getItem('year') || '';
    const isTaskAlreadyActive = activeTasks.some(task => task.taskName === "Planting" && task.fieldId === index);
    if (!isTaskAlreadyActive && (!field.currentAcresPlanted || field.currentAcresPlanted === 0)) {
        const iconPath = '/assets/icon/icon_planting.webp';
        const task = new Task(
            "Planting",
            () => plantAcres(index, resourceName),
            undefined,
            totalAcres,
            resourceName,
            '',
            gameYear,
            '',
            iconPath,
            fieldName
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
        addConsoleMessage(`Planting task started for <strong>${fieldName}, ${fieldRegion}</strong> with <strong>${resourceName}</strong>, Vintage <strong>${gameYear}</strong>.`);
    } else {
        addConsoleMessage(`A Planting task is already active or incomplete for field <strong>${fieldName}</strong>, Region: ${fieldRegion}.`);
    }
}

export function plantAcres(index, resourceName) {
    const increment = 10; // Work increment for planting
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const field = farmlands[index] || {};
    const fieldName = field.name || `Field ${index}`;
    const fieldRegion = field.region || '';

    if (!field.acres) {
        addConsoleMessage(`Field <strong>${fieldName}</strong>, does not exist.`);
        return 0;
    }

    const workRemaining = field.acres - (field.currentAcresPlanted || 0);
    const acresToPlant = Math.min(increment, workRemaining);

    if (acresToPlant <= 0) {
        addConsoleMessage(`Field <strong>${fieldName}</strong> is already fully planted.`);
        return 0;
    }

    field.currentAcresPlanted = (field.currentAcresPlanted || 0) + acresToPlant;

    if (field.currentAcresPlanted >= field.acres) {
        field.plantedResourceName = resourceName;
        addConsoleMessage(`Field <strong>${fieldName}</strong> fully planted with <strong>${resourceName}.</strong>`);
    } else {
        addConsoleMessage(`${acresToPlant} acres planted with <strong>${resourceName}</strong> on field <strong>${fieldName}</strong>. Total planted: <strong>${field.currentAcresPlanted} out of ${field.acres}</strong> acres.`);
    }

    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
    return acresToPlant;
}


export { buyLand, Farmland, displayOwnedFarmland, handlePlantingTask };