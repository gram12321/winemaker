import { getUnit, convertToCurrentUnit } from './settings.js';
import { getFlagIcon, formatNumber, getColorClass } from './utils.js';
import { getResourceByName } from './resource.js';
import { loadFarmlands } from './database/adminFunctions.js';
import taskManager from './taskManager.js';  // Add this import
import { countryRegionMap, regionSoilTypes, regionAltitudeRanges, calculateAndNormalizePriceFactor, regionPrestigeRankings   } from '/js/names.js'; // Import names and country-region map
import { italianMaleNames, italianFemaleNames, germanMaleNames, germanFemaleNames, spanishMaleNames, spanishFemaleNames, frenchMaleNames, frenchFemaleNames, usMaleNames, usFemaleNames, normalizeLandValue } from './names.js';
import { showFarmlandOverlay } from './overlays/farmlandOverlay.js';
import { showPlantingOverlay } from './overlays/plantingOverlay.js';
import { showResourceInfoOverlay } from './overlays/resourceInfoOverlay.js';

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
    this.status = 'No yield in first season'; // Always start with no yield
    this.ripeness = 0.0; // Initial ripeness level
    this.farmlandPrestige = calculateFarmlandPrestige(this); // Calculate and set farmland prestige
    this.canBeCleared = 'Ready to be cleared'; // State regarding field clearing
    this.annualYieldFactor = (0.75 + Math.random()) ; // Random yield factor calculation
    this.annualQualityFactor = Math.random(); // Random quality factor calculation
  }
}

export function farmlandYield(farmland) {
    if (!farmland.plantedResourceName || 
        farmland.annualYieldFactor === 0 || 
        farmland.status === 'Harvested') {
        return 0;
    }

    const resource = getResourceByName(farmland.plantedResourceName);
    if (resource) {
        const baseYieldPerAcre = 2400; // About 2.4 tons per acre
        const densityModifier = farmland.density / 5000; // Removed cap, baseline at 5000
        const qualityMultiplier = (farmland.ripeness + resource.naturalYield + farmland.farmlandHealth) / 3;
        const expectedYield = baseYieldPerAcre * farmland.acres * qualityMultiplier * farmland.annualYieldFactor * densityModifier;
        return expectedYield;
    }
    return 0;
}

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



// Calculate farmland prestige with contributions from age, land value, prestige ranking, and fragility bonus in separate functions (for export to farmlandoverlay.js)

export function calculateAgeContribution(ageModifier) {
  return ageModifier * 0.30;
}
export function calculateLandValueContribution(landvalueNormalized) {
  return landvalueNormalized * 0.25;
}
export function calculatePrestigeRankingContribution(prestigeRanking) {
  return prestigeRanking * 0.25;
}
export function calculateFragilityBonusContribution(fragilityBonus) {
  return fragilityBonus * 0.20;
}


export function calculateFarmlandPrestige(farmland) {
  const ageModifier = farmlandAgePrestigeModifier(farmland.vineAge);
  const landvalueNormalized = normalizeLandValue(farmland.landvalue);
  const prestigeRanking = regionPrestigeRankings[`${farmland.region}, ${farmland.country}`] || 0;
  const fragilityBonus = farmland.plantedResourceName ? (1 - getResourceByName(farmland.plantedResourceName).fragile) : 0;

  const finalPrestige = (
    calculateAgeContribution(ageModifier) +
    calculateLandValueContribution(landvalueNormalized) +
    calculatePrestigeRankingContribution(prestigeRanking) +
    calculateFragilityBonusContribution(fragilityBonus)
  ) || 0.01;

  return {
    finalPrestige,
    ageContribution: calculateAgeContribution(ageModifier),
    landValueContribution: calculateLandValueContribution(landvalueNormalized),
    prestigeRankingContribution: calculatePrestigeRankingContribution(prestigeRanking),
    fragilityBonusContribution: calculateFragilityBonusContribution(fragilityBonus)
  };
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
    const rand = Math.random() * 100;
    let acres;

    if (rand < 25) { // Very Small: 25%
        acres = 0.1 + Math.random() * 0.9;
    } else if (rand < 60) { // Small: 35%
        acres = 1 + Math.random() * 4;
    } else if (rand < 85) { // Medium: 25%
        acres = 5 + Math.random() * 15;
    } else if (rand < 93) { // Large: 8%
        acres = 20 + Math.random() * 30;
    } else if (rand < 96) { // Very Large: 3%
        acres = 50 + Math.random() * 450;
    } else if (rand < 96.5) { // Extra Large: 0.5%
        acres = 500 + Math.random() * 500;
    } else if (rand < 96.6) { // Ultra Large: 0.1%
        acres = 1000 + Math.random() * 4000;
    } else { // Fallback to medium size
        acres = 5 + Math.random() * 15;
    }

    return parseFloat(acres.toFixed(2));
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

export { Farmland, normalizeLandValue };