import { addConsoleMessage, getIconHtml } from '/js/console.js';
import { countryRegionMap, regionAspectRatings, regionSoilTypes, regionAltitudeRanges, calculateAndNormalizePriceFactor  } from '/js/names.js'; // Import names and country-region map
import { italianMaleNames, italianFemaleNames, germanMaleNames, germanFemaleNames, spanishMaleNames, spanishFemaleNames, frenchMaleNames, frenchFemaleNames, usMaleNames, usFemaleNames } from './names.js';
import { allResources, inventoryInstance, getResourceByName  } from '/js/resource.js';
import { saveInventory, saveTask, activeTasks } from '/js/database/adminFunctions.js';
import { Task } from './loadPanel.js'; 
import { getFlagIcon, getColorClass, formatLandSizeWithUnit, formatNumber } from './utils.js';

import { getUnit, convertToCurrentUnit } from './settings.js';
import { showFarmlandOverlay } from './overlays/farmlandOverlay.js';

// In js/farmland.js

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
    this.landvalue = this.calculateLandvalue();
    this.status = 'Dormancy'; // Initialize status
    this.ripeness = 0.1; // Initialize ripeness
  }

  calculateLandvalue() {
    return calculateAndNormalizePriceFactor(this.country, this.region, this.altitude, this.aspect);
  }
}

export function farmlandYield(farmland) {
  if (farmland.plantedResourceName) {
    const resource = getResourceByName(farmland.plantedResourceName);
    if (resource) {
      return farmland.ripeness * resource.naturalYield;
    }
  }
  return 0; // No yield if nothing is planted
}

export function createFarmland(id, acres = getRandomAcres(), soil = '', altitude = '', aspect = '') {
  const country = getRandomItem(Object.keys(countryRegionMap));
  const region = getRandomItem(countryRegionMap[country]);
  aspect = aspect || getRandomAspect();
  const name = getRandomName(country, aspect); // Pass both country and aspect to generate the name

  soil = soil || getRandomSoil(country, region);
  altitude = altitude || getRandomAltitude(country, region);

  return new Farmland(id, name, country, region, acres, null, '', '', soil, altitude, aspect);
}


function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function getLastId(farmlands) {
  if (farmlands.length === 0) return 0;
  return Math.max(...farmlands.map(farmland => farmland.id));
}

// Function to get a random number of acres between 1 and 200
export function getRandomAcres() {
  return Math.floor(Math.random() * 200) + 1;
}

// Function to get a random soil type for a given country and region
// Function to select a random number of unique soil types from a given country's region
function getRandomSoil(country, region) {
  const soils = regionSoilTypes[country][region];
  const numberOfSoils = Math.floor(Math.random() * 5) + 1; // Randomly choose between 1 and 5 soils
  const selectedSoils = new Set();

  while (selectedSoils.size < numberOfSoils) {
    const soil = getRandomItem(soils);
    selectedSoils.add(soil);
  }

  return Array.from(selectedSoils).join(', '); // Convert set to array and return as comma-separated string
}

// Function to get a random altitude within the range for a given country and region
function getRandomAltitude(country, region) {
  const [min, max] = regionAltitudeRanges[country][region];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomName(country, aspect) {
  let names = [];

  // Determine gender-based name list based on the aspect
  const isFemaleAspect = ['East', 'Southeast', 'South', 'Southwest'].includes(aspect);

  switch (country) {
    case 'Italy':
      names = isFemaleAspect ? italianFemaleNames : italianMaleNames;
      break;
    case 'Germany':
      names = isFemaleAspect ? germanFemaleNames : germanMaleNames;
      break;
    case 'Spain':
      names = isFemaleAspect ? spanishFemaleNames : spanishMaleNames;
      break;
    case 'France':
      names = isFemaleAspect ? frenchFemaleNames : frenchMaleNames;
      break;
    case 'United States':
      names = isFemaleAspect ? usFemaleNames : usMaleNames;
      break;
    default:
      names = ['Default Name'];
  }

  const randomIndex = Math.floor(Math.random() * names.length);
  return names[randomIndex];
}

function getRandomAspect() {
  const aspects = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
  return getRandomItem(aspects);
}





export function displayOwnedFarmland() {
  const farmlandEntries = document.querySelector('#farmland-entries');
  farmlandEntries.innerHTML = ''; // Clear existing entries
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  const resourceOptions = allResources.map(resource => `<option value="${resource.name}">${resource.name}</option>`).join('');
  const selectedUnit = getUnit(); // Get the current unit setting

  farmlands.forEach((farmland, index) => {
    const landSize = convertToCurrentUnit(farmland.acres);
    const row = document.createElement('tr');

    // Check if there's an active task on this field
    const isTaskActiveOnField = activeTasks.some(task => task.fieldId === index);
    const canPlant = !isTaskActiveOnField && !farmland.plantedResourceName;
    const canUproot = !isTaskActiveOnField && farmland.plantedResourceName;

    row.innerHTML = `
      <td><img src="/assets/pic/vineyard_dalle.webp" alt="Vineyard Image" style="width: 100px; height: auto;"></td>
      <td>${farmland.name}</td>
      <td>
        ${getFlagIcon(farmland.country)}
        ${farmland.country}, ${farmland.region}
      </td>
      <td>${formatNumber(landSize)} ${selectedUnit}</td>
      <td>${farmland.plantedResourceName || 'None'}</td>
      <td class="planting-options-column">
        <select class="form-control resource-select">
          ${resourceOptions}
        </select>
      </td>
      <td>
        <button class="btn btn-warning plant-field-btn mt-2 ${canPlant ? '' : 'disabled-btn'}" ${canPlant ? '' : 'disabled'}>Plant</button>
        <button class="btn btn-danger uproot-field-btn mt-2 ${canUproot ? '' : 'disabled-btn'}" ${canUproot ? '' : 'disabled'}>Uproot</button>
      </td>
    `;

    farmlandEntries.appendChild(row);

    // Add event listener to open overlay on row click
    row.addEventListener('click', (event) => {
      const isDropdownOrButton = event.target.classList.contains('resource-select') || event.target.classList.contains('plant-field-btn') || event.target.classList.contains('uproot-field-btn');
      if (!isDropdownOrButton) {
        showFarmlandOverlay(farmland);
      }
    });

    // Planting Logic
    const plantButton = row.querySelector('.plant-field-btn');
    plantButton.addEventListener('click', (event) => {
      if (!plantButton.disabled) {
        event.stopPropagation(); // Prevent row click event
        const resourceSelect = row.querySelector('.resource-select');
        const selectedResource = resourceSelect.value;
        handlePlantingTask(index, selectedResource, farmland.acres);
        displayOwnedFarmland();
      }
    });

    // Uprooting Logic
    const uprootButton = row.querySelector('.uproot-field-btn');
    uprootButton.addEventListener('click', (event) => {
      if (!uprootButton.disabled) {
        event.stopPropagation(); // Prevent row click event
        handleUprootTask(index);
        displayOwnedFarmland();
      }
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

        Object.assign(task, { fieldId: index, fieldName });

        field.plantedResourceName = "Currently being planted";
        field.status = "No yield in first season"; // Set initial status

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
        localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
        displayOwnedFarmland();
    } else {
        addConsoleMessage(`A Planting task is already active or incomplete for field <strong>${fieldName}</strong>, Region: ${fieldRegion}.`);
    }
}

export function plantAcres(index, resourceName) {
    const increment = 10; // Work increment for planting
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const field = farmlands[index];
    const fieldName = field.name || `Field ${index}`;

    const workRemaining = field.acres - (field.currentAcresPlanted || 0);
    const acresToPlant = Math.min(increment, workRemaining);

    if (acresToPlant <= 0) {
        addConsoleMessage(`Field <strong>${fieldName}</strong> is already fully planted.`);
        return 0;
    }

    field.currentAcresPlanted = (field.currentAcresPlanted || 0) + acresToPlant;

    // Check if planting is complete
    if (field.currentAcresPlanted >= field.acres) {
        field.plantedResourceName = resourceName;
        field.vineAge = 0; // Set vineAge to 0 as planting is complete
        addConsoleMessage(`Field <strong>${fieldName}</strong> fully planted with <strong>${resourceName}.</strong>`);
    } else {
        addConsoleMessage(`${acresToPlant} acres planted with <strong>${resourceName}</strong> on field <strong>${fieldName}</strong>. Total planted: <strong>${field.currentAcresPlanted} out of ${field.acres}</strong> acres.`);
    }

    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
    return acresToPlant;
}

function handleUprootTask(index) {
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  const field = farmlands[index];
  const fieldName = field.name || `Field ${index}`;

  // Check if another task is active on the same field
  const isTaskAlreadyActiveOnField = activeTasks.some(task => task.fieldId === index);

  if (isTaskAlreadyActiveOnField) {
    addConsoleMessage(`Another task is already active for <strong>${fieldName}</strong>. Uprooting cannot be done until all tasks are completed.`);
    return;
  }

  // Deny uprooting under specific conditions
  const isFieldUnplanted = !field.plantedResourceName;
  const isBeingPlanted = field.status === "Currently being planted";

  if (isFieldUnplanted || isBeingPlanted || field.vineAge == null) {
    addConsoleMessage(`Uprooting is not allowed for <strong>${fieldName}</strong> as it is either unplanted, not fully planted, or currently being planted.`);
    return;
  }

  const iconPath = '/assets/icon/icon_uprooting.webp';  // Use an appropriate icon path
  const task = new Task(
    "Uprooting",
    () => uproot(index),
    undefined,
    field.acres,
    field.plantedResourceName,
    '',
    localStorage.getItem('year') || '',
    '',
    iconPath,
    fieldName
  );

  Object.assign(task, { fieldId: index, fieldName });

  saveTask({
    taskName: task.taskName,
    fieldId: index,
    fieldName: task.fieldName,
    resourceName: task.resourceName,
    taskId: task.taskId,
    workTotal: field.acres,
    vintage: task.vintage,
    iconPath: task.iconPath
  });

  activeTasks.push(task);
  addConsoleMessage(`Uprooting task started for <strong>${fieldName}</strong>.`);
}

// Ensure that uproot is exported
export function uproot(index) {
    const increment = 10;  // Work increment for uprooting
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const field = farmlands[index];

    const workRemaining = field.acres - (field.currentAcresUprooted || 0);
    const acresToUproot = Math.min(increment, workRemaining);

    if (acresToUproot <= 0) {
        addConsoleMessage(`Field <strong>${field.name}</strong> is already fully uprooted.`);
        return 0;
    }

    field.currentAcresUprooted = (field.currentAcresUprooted || 0) + acresToUproot;

    if (field.currentAcresUprooted >= field.acres) {
        field.plantedResourceName = null; // Reset the crop
        field.vineAge = null; // Reset vine age
        field.currentAcresPlanted = 0; // Reset planting progress
        addConsoleMessage(`Field <strong>${field.name}</strong> fully uprooted.`);
    } else {
        addConsoleMessage(`Uprooted ${acresToUproot} acres from field <strong>${field.name}</strong>. Total uprooted: <strong>${field.currentAcresUprooted} out of ${field.acres}</strong> acres.`);
    }

    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
    saveInventory();
    return acresToUproot;
}

export { Farmland, handlePlantingTask };