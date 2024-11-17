import { addConsoleMessage  } from '/js/console.js';
import { countryRegionMap, regionSoilTypes, regionAltitudeRanges, calculateAndNormalizePriceFactor, regionPrestigeRankings   } from '/js/names.js'; // Import names and country-region map
import { italianMaleNames, italianFemaleNames, germanMaleNames, germanFemaleNames, spanishMaleNames, spanishFemaleNames, frenchMaleNames, frenchFemaleNames, usMaleNames, usFemaleNames, normalizeLandValue } from './names.js';
import { allResources, getResourceByName, inventoryInstance  } from '/js/resource.js';
import { saveInventory, saveTask, activeTasks } from '/js/database/adminFunctions.js';
import { Task } from './loadPanel.js'; 
import { getFlagIcon, formatNumber } from './utils.js';
import { getUnit, convertToCurrentUnit } from './settings.js';
import { showFarmlandOverlay } from './overlays/farmlandOverlay.js';
import {calculateWorkApplied } from './staff.js';
import { handleGenericTask } from './administration.js';



// Refactored calculateFarmlandPrestige function
function calculateFarmlandPrestige(farmland) {
  const ageModifier = farmland.farmlandAgePrestigeModifier();
  const landvalueNormalized = normalizeLandValue(farmland.landvalue);
  const prestigeRanking = regionPrestigeRankings[`${farmland.region}, ${farmland.country}`] || 0;

  const finalPrestige = (ageModifier + landvalueNormalized + prestigeRanking) / 3 || 0.01;

  return finalPrestige;
}

class Farmland {
  constructor(id, name, country, region, acres, plantedResourceName = null, vineAge = '', grape = '', soil = '', altitude = '', aspect = '', density = '', farmlandHealth = 0.5 ) {
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
    this.farmlandHealth = farmlandHealth;
    this.landvalue = this.calculateLandvalue();
    this.status = 'Dormancy'; // Initialize status
    this.ripeness = 0.1; // Initialize ripeness
    this.farmlandPrestige = calculateFarmlandPrestige(this); // Initialize with the calculated prestige
    this.canBeCleared = 'Ready to be cleared'; // Default state allowing clearing
  }

  calculateLandvalue() {
    return calculateAndNormalizePriceFactor(this.country, this.region, this.altitude, this.aspect);
  }

  farmlandAgePrestigeModifier() {
    const age = parseFloat(this.vineAge);
    if (isNaN(age) || age < 0) {
      return 0;
    } else if (age <= 3) {
      return (age * age) / 100 + 0.01;
    } else if (age <= 25) {
      return 0.1 + (age - 3) * (0.4 / 22);
    } else if (age <= 100) {
      return 0.5 + (Math.atan((age - 25) / 20) / Math.PI) * (0.95 - 0.5);
    } else {
      return 0.95;
    }
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

export function getRandomAcres() {
  return Math.floor(Math.random() * 200) + 1;
}

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
    const canClear = !isTaskActiveOnField && !farmland.plantedResourceName;

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
        <button class="btn btn-info clear-field-btn mt-2 ${canClear ? '' : 'disabled-btn'}" ${canClear ? '' : 'disabled'}>Clear</button>
      </td>
    `;

    farmlandEntries.appendChild(row);

    // Add event listener to open overlay on row click
    row.addEventListener('click', (event) => {
      const isDropdownOrButton = event.target.classList.contains('resource-select') || event.target.classList.contains('plant-field-btn') || event.target.classList.contains('uproot-field-btn') || event.target.classList.contains('clear-field-btn');
      if (!isDropdownOrButton) {
        showFarmlandOverlay(farmland);
      }
    });

    // Updated Planting Logic
    const plantButton = row.querySelector('.plant-field-btn');
    plantButton.addEventListener('click', (event) => {
      if (!plantButton.disabled) {
        event.stopPropagation();
        const resourceSelect = row.querySelector('.resource-select');
        const selectedResource = resourceSelect.value;
        const additionalTaskParams = { fieldId: index, resourceName: selectedResource };
        handleGenericTask("Planting", (task, mode) => fieldTaskFunction(task, mode, "Planting", additionalTaskParams), additionalTaskParams);
        displayOwnedFarmland();
      }
    });

    // Updated Uprooting Logic
    const uprootButton = row.querySelector('.uproot-field-btn');
    uprootButton.addEventListener('click', (event) => {
      if (!uprootButton.disabled) {
        event.stopPropagation();
        handleGenericTask('Uprooting', (task, mode) => fieldTaskFunction(task, mode, "Uprooting", { fieldId: index }), { fieldId: index });
        displayOwnedFarmland();
      }
    });

    // Clear field button logic
    const clearButton = row.querySelector('.clear-field-btn');
    clearButton.addEventListener('click', (event) => {
      if (!clearButton.disabled) {
        event.stopPropagation();
        handleGenericTask('Clearing', (task, mode) => fieldTaskFunction(task, mode, "Clearing", { fieldId: index }), { fieldId: index });
        displayOwnedFarmland();
      }
    });
  });
}

export function fieldTaskFunction(task, mode, taskType, { fieldId, resourceName } = {}) {
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  const field = farmlands[fieldId];
  const fieldName = field.name || `Field ${fieldId}`;
  const gameYear = localStorage.getItem('year') || '';
  const vintage = field.vintage || '';

  // Check if any task is already active on this field
  const isAnyTaskActiveOnField = activeTasks.some(task => task.fieldId === fieldId);

  // Check specifically if a harvest task is active on this field
  const isHarvestTaskActive = activeTasks.some(task => task.fieldId === fieldId && task.taskName === "Harvesting");

  if (mode === 'initialize') {
    if (taskType === "Planting") {
      if (isAnyTaskActiveOnField) {
        addConsoleMessage(`Another task is already active on field <strong>${fieldName}</strong>.`);
        return null;
      }

      field.plantedResourceName = "Currently being planted";
      field.status = "No yield in first season";
      localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));

      return {
        taskName: "Planting",
        workTotal: field.acres,
        iconPath: '/assets/icon/icon_planting.webp',
        taskType: 'Field',
        fieldName,
        resourceName,
        vintage: gameYear
      };
    } else if (taskType === "Uprooting") {
      if (isAnyTaskActiveOnField) {
        addConsoleMessage(`Another task is already active on field <strong>${fieldName}</strong>.`);
        return null;
      }

      return {
        taskName: "Uprooting",
        workTotal: field.acres,
        iconPath: '/assets/icon/icon_uprooting.webp',
        taskType: 'Field',
        fieldName,
        resourceName: resourceName || '',
        vintage
      };
    } else if (taskType === "Harvesting") {
      if (isAnyTaskActiveOnField || field.currentAcresHarvested >= field.acres) {
        const message = isAnyTaskActiveOnField 
          ? `Another task is already active on field <strong>${fieldName}</strong>.`
          : `The field is already fully harvested for <strong>${fieldName}</strong>.`;
        addConsoleMessage(message);
        return null;
      }

      if (!field.plantedResourceName) {
        addConsoleMessage(`No planted resource found for Field ID ${field.id || 'unknown'}.`);
        return null;
      }

      field.status = "Being harvested";
      localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));

      addConsoleMessage(`Harvesting task started for <strong>${fieldName}</strong> with <strong>${field.plantedResourceName}</strong>, Vintage <strong>${gameYear}</strong>.`);

      return {
        taskName: "Harvesting",
        workTotal: field.acres,
        iconPath: '/assets/icon/icon_harvesting.webp',
        taskType: 'Field',
        fieldName,
        resourceName: field.plantedResourceName,
        vintage: gameYear
      };
    } else if (taskType === "Clearing") {
      if (isAnyTaskActiveOnField) {
        addConsoleMessage(`Another task is already active on field <strong>${fieldName}</strong>.`);
        return null;
      }

      if (field.plantedResourceName) {
        addConsoleMessage(`Cannot start clearing on field <strong>${fieldName}</strong> as it is not empty.`);
        return null;
      }

      return {
        taskName: "Clearing",
        workTotal: field.acres,
        iconPath: '/assets/icon/icon_clearing.webp',
        taskType: 'Field',
        fieldName,
      };
    }
  } else if (mode === 'update') {
    if (taskType === "Planting") {
      return plantAcres(fieldId, resourceName);
    } else if (taskType === "Uprooting") {
      if (isHarvestTaskActive) {
        addConsoleMessage(`Cannot uproot while a harvesting task is active on field <strong>${fieldName}</strong>.`);
        return 0;
      }
      return uproot(fieldId);
    } else if (taskType === "Harvesting") {
      return harvestAcres(fieldId);
    } else if (taskType === "Clearing") {
      return clearing(fieldId);
    }
  }

  return 0;
}

export function plantAcres(index, resourceName) {
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  const field = farmlands[index];
  const fieldName = field.name || `Field ${index}`;
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const currentTask = tasks.find(task => task.taskName === "Planting" && task.fieldId === index);

  // Allow planting if the field is ready or has been cleared
  if (field.canBeCleared === 'Ready to be cleared') {
    field.canBeCleared = 'Planted without Clearing';
  } else if (field.canBeCleared !== 'Planted without Clearing' && field.canBeCleared !== 'Cleared') {
    addConsoleMessage(`Field <strong>${fieldName}</strong> cannot be planted. It has not been cleared.`);
    return 0;
  }

  const workApplied = calculateWorkApplied(currentTask?.staff || [], 'plantAcres');

  console.log(`Work applied for planting on ${fieldName}: ${workApplied}`);

  const workRemaining = field.acres - (field.currentAcresPlanted || 0);
  const acresToPlant = Math.min(workApplied, workRemaining);

  if (acresToPlant <= 0) {
    addConsoleMessage(`Field <strong>${fieldName}</strong> is already fully planted.`);
    return 0;
  }

  field.currentAcresPlanted = (field.currentAcresPlanted || 0) + acresToPlant;

  if (field.currentAcresPlanted >= field.acres) {
    field.plantedResourceName = resourceName;
    field.vineAge = 0;
    addConsoleMessage(`Field <strong>${fieldName}</strong> fully planted with <strong>${resourceName}.</strong>`);
  } else {
    addConsoleMessage(`${acresToPlant} acres planted with <strong>${resourceName}</strong> on field <strong>${fieldName}</strong>. Total planted: <strong>${field.currentAcresPlanted} out of ${field.acres}</strong> acres.`);
  }

  localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
  return acresToPlant;
}

export function uproot(index) {
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  const field = farmlands[index];
  const fieldName = field.name || `Field ${index}`;
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const currentTask = tasks.find(task => task.taskName === "Uprooting" && task.fieldId === index);

  const workApplied = calculateWorkApplied(currentTask?.staff || [], 'uproot');

  const workRemaining = field.acres - (field.currentAcresUprooted || 0);
  const acresToUproot = Math.min(workApplied, workRemaining);

  if (acresToUproot <= 0) {
    addConsoleMessage(`Field <strong>${fieldName}</strong> is already fully uprooted.`);
    return 0;
  }

  field.currentAcresUprooted = (field.currentAcresUprooted || 0) + acresToUproot;

  if (field.currentAcresUprooted >= field.acres) {
    field.plantedResourceName = null; 
    field.vineAge = null; 
    field.currentAcresPlanted = 0; 
    field.canBeCleared = 'Ready to be cleared'; // Reset state after uproot
    addConsoleMessage(`Field <strong>${fieldName}</strong> fully uprooted.`);
  } else {
    addConsoleMessage(`Uprooted ${acresToUproot} acres from field <strong>${fieldName}</strong>. Total uprooted: <strong>${field.currentAcresUprooted} out of ${field.acres}</strong> acres.`);
  }

  localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
  saveInventory();

  return acresToUproot;
}

export function clearing(index) {
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const field = farmlands[index];
    const fieldName = field.name || `Field ${index}`;

    if (field.canBeCleared !== 'Ready to be cleared') {
        addConsoleMessage(`Field <strong>${fieldName}</strong> cannot be cleared. It needs to be uprooted first or has already been cleared.`);
        return 0;
    }

    if (field.plantedResourceName) {
        addConsoleMessage(`Cannot clear field <strong>${fieldName}</strong> as it is not empty.`);
        return 0;
    }

    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const currentTask = tasks.find(task => task.taskName === "Clearing" && task.fieldId === index);

    const workApplied = calculateWorkApplied(currentTask?.staff || [], 'clearing');

    const workRemaining = field.acres - (field.currentAcresCleared || 0);
    const acresToClear = Math.min(workApplied, workRemaining);

    if (acresToClear <= 0) {
        addConsoleMessage(`Field <strong>${fieldName}</strong> is already fully cleared.`);
        return 0;
    }

    field.currentAcresCleared = (field.currentAcresCleared || 0) + acresToClear;

    if (field.currentAcresCleared >= field.acres) {
        field.farmlandHealth = Math.min(field.farmlandHealth + 0.25, 1.0);
        field.currentAcresCleared = 0; 
        field.canBeCleared = 'Cleared'; // Update state after clearing
        addConsoleMessage(`Field <strong>${fieldName}</strong> fully cleared and health improved.`);
    } else {
        addConsoleMessage(`Cleared ${acresToClear} acres from field <strong>${fieldName}</strong>. Total cleared: <strong>${field.currentAcresCleared} out of ${field.acres}</strong> acres.`);
    }

    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
    return acresToClear;
}

export { Farmland };