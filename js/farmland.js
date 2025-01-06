
import { getUnit, convertToCurrentUnit } from './settings.js';
import { getFlagIcon, formatNumber, getColorClass } from './utils.js';

import { addConsoleMessage  } from '/js/console.js';
import { countryRegionMap, regionSoilTypes, regionAltitudeRanges, calculateAndNormalizePriceFactor, regionPrestigeRankings   } from '/js/names.js'; // Import names and country-region map
import { italianMaleNames, italianFemaleNames, germanMaleNames, germanFemaleNames, spanishMaleNames, spanishFemaleNames, frenchMaleNames, frenchFemaleNames, usMaleNames, usFemaleNames, normalizeLandValue } from './names.js';
import { allResources, getResourceByName, inventoryInstance  } from '/js/resource.js';
import { saveInventory } from '/js/database/adminFunctions.js';
//import { getFlagIcon, formatNumber } from './utils.js';
//import { getUnit, convertToCurrentUnit } from './settings.js';
import { showFarmlandOverlay } from './overlays/farmlandOverlay.js';
import { showPlantingOverlay } from './overlays/plantingOverlay.js';


// Refactored standalone function for land value calculation
export function calculateLandvalue(country, region, altitude, aspect) {
  return calculateAndNormalizePriceFactor(country, region, altitude, aspect);
}

// Refactored standalone function for farmland age prestige modifier
export function farmlandAgePrestigeModifier(vineAge) {
  const age = parseFloat(vineAge);
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

// Refactored calculateFarmlandPrestige function using standalone prestige modifier
export function calculateFarmlandPrestige(farmland) {
  const ageModifier = farmlandAgePrestigeModifier(farmland.vineAge); // Use standalone function
  const landvalueNormalized = normalizeLandValue(farmland.landvalue);
  const prestigeRanking = regionPrestigeRankings[`${farmland.region}, ${farmland.country}`] || 0;

  const finalPrestige = (ageModifier + landvalueNormalized + prestigeRanking) / 3 || 0.01;

  return finalPrestige;
}

class Farmland {
  constructor(id, name, country, region, acres, plantedResourceName = null, vineAge = '', grape = '', soil = '', altitude = '', aspect = '', density = 5000, farmlandHealth = 0.5) {
    this.id = id; // Unique identifier for the farmland
    this.name = name; // Name of the farmland
    this.country = country; // Country where the farmland is located
    this.region = region; // Region within the country
    this.acres = acres; // Size in acres
    this.plantedResourceName = plantedResourceName; // Type of crop/resource planted
    this.vineAge = vineAge; // Age of the vines (if applicable)
    this.grape = grape; // Type of grape (if specific to vineyards)
    this.soil = soil; // Soil type
    this.altitude = altitude; // Altitude of the location
    this.aspect = aspect; // Aspect (slope direction)
    this.density = density; // Planting density
    this.farmlandHealth = farmlandHealth; // Current health state of the farmland
    this.landvalue = calculateLandvalue(this.country, this.region, this.altitude, this.aspect); // Calculate and set land value
    this.status = 'Dormancy'; // Initial status, assuming starting in a dormant state
    this.ripeness = 0.1; // Initial ripeness level
    this.farmlandPrestige = calculateFarmlandPrestige(this); // Calculate and set farmland prestige
    this.canBeCleared = 'Ready to be cleared'; // State regarding field clearing
    this.annualYieldFactor = (0.5 + Math.random()) * 1.5; // Random yield factor calculation
    this.annualQualityFactor = Math.random(); // Random quality factor calculation
  }
}

export function farmlandYield(farmland) {
  if (farmland.plantedResourceName) {
    const resource = getResourceByName(farmland.plantedResourceName);
    if (resource) {
      // Calculate the theoretical yield
      const theoreticalYield = (farmland.ripeness + resource.naturalYield + farmland.farmlandHealth) / 3;

      // Use the existing annualYieldFactor
      const expectedYield = theoreticalYield * farmland.annualYieldFactor * (farmland.density / 1000);

      return expectedYield;
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

export function displayFarmland() {
  const farmlandEntries = document.querySelector('#farmland-entries');
  if (!farmlandEntries) return;
  
  farmlandEntries.innerHTML = ''; // Clear existing entries
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  const selectedUnit = getUnit();

  farmlands.forEach((farmland) => {
    const landSize = convertToCurrentUnit(farmland.acres);
    const row = document.createElement('tr');
    
    // Create planting options dropdown
    const plantingOptions = allResources.map(resource => 
      `<option value="${resource.name}">${resource.name}</option>`
    ).join('');
    
    row.innerHTML = `
      <td><img src="/assets/pic/vineyard_dalle.webp" alt="Vineyard Image" style="width: 100px; height: auto;"></td>
      <td>${farmland.name}</td>
      <td>
        ${getFlagIcon(farmland.country)}
        ${farmland.country}, ${farmland.region}
      </td>
      <td>${formatNumber(landSize)} ${selectedUnit}</td>
      <td>${farmland.plantedResourceName || 'None'}</td>
      <td>
        <select class="planting-select form-control" data-farmland-id="${farmland.id}">
          <option value="">Select Resource</option>
          ${plantingOptions}
        </select>
      </td>
      <td>
        <button class="btn btn-primary plant-btn" data-farmland-id="${farmland.id}">Plant</button>
      </td>
    `;

    // Add event listeners
    const plantBtn = row.querySelector('.plant-btn');
    const farmlandRow = row.querySelectorAll('td:not(:last-child):not(:nth-last-child(2))');
    
    // Planting button click handler
    plantBtn.addEventListener('click', () => {
      const select = row.querySelector('.planting-select');
      const selectedResource = select.value;
      if (selectedResource) {
        farmland.plantedResourceName = selectedResource;
        showPlantingOverlay(farmland, (density) => {
          displayFarmland(); // Refresh display
        });
      }
    });

    // Farmland details click handler (excluding planting controls and dropdown)
    farmlandRow.forEach(cell => {
      cell.addEventListener('click', () => {
        showFarmlandOverlay(farmland);
      });
    });

    farmlandEntries.appendChild(row);
  });
}

export { Farmland };