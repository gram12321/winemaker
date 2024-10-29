import { addConsoleMessage, getIconHtml } from '/js/console.js';
import { italianMaleNames, italianFemaleNames, countryRegionMap, regionAspectRatings } from '/js/names.js'; // Import names and country-region map
import { allResources, inventoryInstance } from '/js/resource.js';
import { saveInventory, saveTask, activeTasks } from '/js/database/adminFunctions.js';
import { Task } from './loadPanel.js'; 
import { getFlagIcon, getColorClass } from './utils.js';

class Farmland {
  constructor(id, name, country, region, acres, plantedResourceName = null, vineAge = '', grape = '', soil = '', altitude = '', aspect = '', density = '') {
    this.id = id;
    this.name = name;
    this.country = country;
    this.region = region;
    this.acres = acres;
    this.plantedResourceName = plantedResourceName;
    this.vineAge = vineAge;
    this.grape = grape;
    this.soil = soil;
    this.altitude = altitude;
    this.aspect = aspect;
    this.density = density;
  }
}

export function createFarmland(id, name, acres, soil = '', altitude = '', aspect = '') {
  const country = getRandomItem(Object.keys(countryRegionMap));
  const region = getRandomItem(countryRegionMap[country]);
  aspect = aspect || getRandomAspect(); // Use provided aspect or pick a random one
  return new Farmland(id, name, country, region, acres, null, '', '', soil, altitude, aspect);
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function getLastId(farmlands) {
  if (farmlands.length === 0) return 0;
  return Math.max(...farmlands.map(farmland => farmland.id));
}

export function getRandomName() {
  const allNames = italianMaleNames.concat(italianFemaleNames);
  return getRandomItem(allNames);
}

function getRandomAspect() {
  const aspects = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
  return getRandomItem(aspects);
}

function buyLand() {
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  const newId = getLastId(farmlands) + 1;
  const newName = getRandomName();
  const newFarmland = createFarmland(newId, newName, 100); // Removed hard-coded country and region
  farmlands.push(newFarmland);
  localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
  addConsoleMessage(`Purchased new farmland: "<strong>${newFarmland.name}</strong>" in <strong>${newFarmland.country}, ${newFarmland.region}</strong>, with total <strong>${newFarmland.acres} </strong>Acres`);
  displayOwnedFarmland();
}



export function displayOwnedFarmland() {
  const farmlandEntries = document.querySelector('#farmland-entries');
  farmlandEntries.innerHTML = ''; // Clear existing entries
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  const resourceOptions = allResources.map(resource => `<option value="${resource.name}">${resource.name}</option>`).join('');
  farmlands.forEach((farmland, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    // Calculate the aspect rating
    const aspectRating = regionAspectRatings[farmland.country][farmland.region][farmland.aspect];
    const colorClass = getColorClass(aspectRating);
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
                <th>Soil</th>
                <th>Altitude</th>
                <th>Aspect</th>
                <th>Planting Options</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${farmland.name}</td>
                <td>${farmland.acres} Acres</td>
                <td>${farmland.plantedResourceName || 'Empty'}</td>
                <td>${farmland.soil}</td>
                <td>${farmland.altitude}</td>
                <td class="${colorClass}">${farmland.aspect} (${aspectRating.toFixed(2)})</td>
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


export { buyLand, Farmland, handlePlantingTask };