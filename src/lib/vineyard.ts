// Vineyard type and utility functions for the Winery Management Game

// Countries and regions data
export const countryRegionMap = {
  "France": ["Bordeaux", "Burgundy (Bourgogne)", "Champagne", "Loire Valley", "Rhone Valley", "Jura"],
  "Germany": ["Ahr", "Mosel", "Pfalz", "Rheingau", "Rheinhessen"],
  "Italy": ["Piedmont", "Puglia", "Sicily", "Tuscany", "Veneto"],
  "Spain": ["Jumilla", "La Mancha", "Ribera del Duero", "Rioja", "Sherry (Jerez)"],
  "United States": ["Central Coast (California)", "Finger Lakes (New York)", "Napa Valley (California)", "Sonoma County (California)", "Willamette Valley (Oregon)"],
};

// Soil types by region
export const regionSoilTypes = {
  "France": {
    "Bordeaux": ["Clay", "Gravel", "Limestone", "Sand"],
    "Burgundy (Bourgogne)": ["Clay-Limestone", "Limestone", "Marl"],
    "Champagne": ["Chalk", "Clay", "Limestone"],
    "Loire Valley": ["Clay", "Flint", "Limestone", "Sand", "Schist"],
    "Rhone Valley": ["Clay", "Granite", "Limestone", "Sand"],
    "Jura": ["Clay", "Limestone", "Marl"],
  },
  "Germany": {
    "Ahr": ["Devonian Slate", "Greywacke", "Loess", "Volcanic Soil"],
    "Mosel": ["Blue Devonian Slate", "Red Devonian Slate"],
    "Pfalz": ["Basalt", "Limestone", "Loess", "Sandstone"],
    "Rheingau": ["Loess", "Phyllite", "Quartzite", "Slate"],
    "Rheinhessen": ["Clay", "Limestone", "Loess", "Quartz"],
  },
  "Italy": {
    "Piedmont": ["Clay", "Limestone", "Marl", "Sand"],
    "Puglia": ["Clay", "Limestone", "Red Earth", "Sand"],
    "Sicily": ["Clay", "Limestone", "Sand", "Volcanic Soil"],
    "Tuscany": ["Clay", "Galestro", "Limestone", "Sandstone"],
    "Veneto": ["Alluvial", "Clay", "Limestone", "Volcanic Soil"],
  },
  "Spain": {
    "Jumilla": ["Clay", "Limestone", "Sand"],
    "La Mancha": ["Clay", "Clay-Limestone", "Sand"],
    "Ribera del Duero": ["Alluvial", "Clay", "Limestone"],
    "Rioja": ["Alluvial", "Clay", "Clay-Limestone", "Ferrous Clay"],
    "Sherry (Jerez)": ["Albariza", "Barros", "Arenas"],
  },
  "United States": {
    "Central Coast (California)": ["Clay", "Loam", "Sand", "Shale"],
    "Finger Lakes (New York)": ["Clay", "Gravel", "Limestone", "Shale"],
    "Napa Valley (California)": ["Alluvial", "Clay", "Loam", "Volcanic"],
    "Sonoma County (California)": ["Clay", "Loam", "Sand", "Volcanic"],
    "Willamette Valley (Oregon)": ["Basalt", "Clay", "Marine Sediment", "Volcanic"],
  },
};

// Altitude ranges by region
export const regionAltitudeRanges = {
  "France": {
    "Bordeaux": [0, 100],
    "Burgundy (Bourgogne)": [200, 500],
    "Champagne": [100, 300],
    "Loire Valley": [50, 200],
    "Rhone Valley": [100, 400],
    "Jura": [250, 400],
  },
  "Germany": {
    "Ahr": [100, 300],
    "Mosel": [100, 350],
    "Pfalz": [100, 300],
    "Rheingau": [80, 250],
    "Rheinhessen": [80, 250],
  },
  "Italy": {
    "Piedmont": [150, 600],
    "Puglia": [0, 200],
    "Sicily": [50, 900],
    "Tuscany": [150, 600],
    "Veneto": [50, 400],
  },
  "Spain": {
    "Jumilla": [400, 800],
    "La Mancha": [600, 800],
    "Ribera del Duero": [700, 900],
    "Rioja": [300, 700],
    "Sherry (Jerez)": [0, 100],
  },
  "United States": {
    "Central Coast (California)": [0, 500],
    "Finger Lakes (New York)": [100, 300],
    "Napa Valley (California)": [0, 600],
    "Sonoma County (California)": [0, 500],
    "Willamette Valley (Oregon)": [50, 300],
  },
};

// Grape varieties
export type GrapeVariety = 
  | "Barbera" 
  | "Chardonnay" 
  | "Pinot Noir" 
  | "Primitivo" 
  | "Sauvignon Blanc"
  | "Cabernet Sauvignon"
  | "Merlot"
  | "Syrah"
  | "Riesling"
  | "Tempranillo";

// Aspect directions
export type Aspect = 
  | "North" 
  | "Northeast" 
  | "East" 
  | "Southeast" 
  | "South" 
  | "Southwest" 
  | "West" 
  | "Northwest";

// Conventional farming methods
export type FarmingMethod = "Conventional" | "Non-Conventional" | "Ecological";

// Vineyard interface
export interface Vineyard {
  id: string;
  name: string;
  country: string;
  region: string;
  acres: number;
  grape: GrapeVariety | null;
  vineAge: number;
  soil: string[];
  altitude: number;
  aspect: Aspect;
  density: number;
  vineyardHealth: number;
  landValue: number;
  status: string;
  ripeness: number;
  vineyardPrestige: number;
  canBeCleared: boolean;
  annualYieldFactor: number;
  annualQualityFactor: number;
  farmingMethod: FarmingMethod;
  organicYears: number;
  remainingYield: number | null;
  ownedSince: Date;
}

/**
 * Calculates the expected yield for a vineyard
 * @param vineyard The vineyard to calculate yield for
 * @returns The expected yield in kg
 */
export function calculateVineyardYield(vineyard: Vineyard): number {
  if (!vineyard.grape || vineyard.annualYieldFactor === 0 || vineyard.status === 'Harvested') {
    return 0;
  }

  const baseYieldPerAcre = 2400; // About 2.4 tons per acre
  const densityModifier = vineyard.density / 5000; // Baseline at 5000 vines per acre
  const qualityMultiplier = (vineyard.ripeness + vineyard.vineyardHealth) / 2;
  let expectedYield = baseYieldPerAcre * vineyard.acres * qualityMultiplier * vineyard.annualYieldFactor * densityModifier;
  
  // Apply bonus multiplier if conventional
  if (vineyard.farmingMethod === 'Conventional') {
    expectedYield *= 1.1;
  }

  return expectedYield;
}

/**
 * Gets the remaining yield for a vineyard
 * @param vineyard The vineyard to calculate remaining yield for
 * @returns The remaining yield in kg
 */
export function getRemainingYield(vineyard: Vineyard): number {
  // If harvest hasn't started yet, return full yield
  if (vineyard.remainingYield === null) {
    return calculateVineyardYield(vineyard);
  }
  // Otherwise return what's left
  return vineyard.remainingYield;
}

/**
 * Calculates the land value based on country, region, altitude, and aspect
 * @param country The country of the vineyard
 * @param region The region within the country
 * @param altitude The altitude in meters
 * @param aspect The aspect (direction) of the vineyard
 * @returns The calculated land value
 */
export function calculateLandValue(country: string, region: string, altitude: number, aspect: Aspect): number {
  // This is a simplified version of the old calculateAndNormalizePriceFactor function
  // We would implement the full logic based on the old names.js implementation
  const baseValue = 1000;
  
  // Region prestige factor (would be based on regionPrestigeRankings)
  const prestigeFactor = 1.0;
  
  // Altitude factor
  const altitudeFactor = normalizeAltitude(altitude, regionAltitudeRanges[country][region]);
  
  // Aspect factor
  // Typically south-facing slopes are most valuable, north-facing least valuable
  let aspectFactor = 0.5;
  if (aspect === "South") aspectFactor = 1.0;
  else if (aspect === "Southeast" || aspect === "Southwest") aspectFactor = 0.9;
  else if (aspect === "East" || aspect === "West") aspectFactor = 0.7;
  else if (aspect === "Northeast" || aspect === "Northwest") aspectFactor = 0.5;
  else if (aspect === "North") aspectFactor = 0.3;
  
  return baseValue * prestigeFactor * altitudeFactor * aspectFactor;
}

/**
 * Normalizes an altitude value based on the min and max of a region
 * @param altitude The altitude to normalize
 * @param range The min and max altitude for the region
 * @returns A value between 0.1 and 1.0
 */
export function normalizeAltitude(altitude: number, range: [number, number]): number {
  const [min, max] = range;
  if (altitude < min) return 0.1;
  if (altitude > max) return 1.0;
  return 0.1 + 0.9 * ((altitude - min) / (max - min));
}

/**
 * Calculates the prestige of a vineyard
 * @param vineyard The vineyard to calculate prestige for
 * @returns The prestige value between 0 and 1
 */
export function calculateVineyardPrestige(vineyard: Vineyard): number {
  // Age contribution (30%)
  const ageContribution = calculateAgeContribution(vineyard.vineAge);
  
  // Land value contribution (25%)
  const landValueContribution = calculateLandValueContribution(vineyard.landValue);
  
  // Region prestige contribution (25%)
  const prestigeRankingContribution = calculateRegionPrestigeContribution(vineyard.region, vineyard.country);
  
  // Grape variety suitability (20%)
  const grapeContribution = calculateGrapeSuitabilityContribution(vineyard.grape, vineyard.region, vineyard.country);
  
  const finalPrestige = (
    ageContribution +
    landValueContribution +
    prestigeRankingContribution +
    grapeContribution
  ) || 0.01;

  return Math.max(0.01, Math.min(1, finalPrestige));
}

function calculateAgeContribution(vineAge: number): number {
  if (vineAge <= 0) return 0;
  
  if (vineAge <= 3) {
    return (vineAge * vineAge) / 100 + 0.01;
  } else if (vineAge <= 25) {
    return 0.1 + (vineAge - 3) * (0.4 / 22);
  } else if (vineAge <= 100) {
    return 0.5 + (Math.atan((vineAge - 25) / 20) / Math.PI) * (0.95 - 0.5);
  } else {
    return 0.95;
  } 
}

function calculateLandValueContribution(landValue: number): number {
  // Normalize land value between 0 and 1
  // This is a placeholder; we would need a proper normalization function
  const normalizedValue = Math.min(landValue / 10000, 1);
  return normalizedValue * 0.25;
}

function calculateRegionPrestigeContribution(region: string, country: string): number {
  // Placeholder for region prestige calculation
  // In the actual implementation, we would use regionPrestigeRankings
  return 0.5 * 0.25;
}

function calculateGrapeSuitabilityContribution(grape: GrapeVariety | null, region: string, country: string): number {
  if (!grape) return 0;
  
  // Placeholder for grape suitability calculation
  // In the actual implementation, we would use grapeSuitability data
  return 0.8 * 0.20;
}

/**
 * Creates a new vineyard with given or random parameters
 * @param id Unique identifier for the vineyard
 * @param options Optional parameters for the vineyard
 * @returns A new Vineyard object
 */
export function createVineyard(id: string, options: Partial<Vineyard> = {}): Vineyard {
  const country = options.country || getRandomFromObject(countryRegionMap);
  const region = options.region || getRandomFromArray(countryRegionMap[country]);
  const aspect = options.aspect || getRandomAspect();
  const name = options.name || generateVineyardName(country, aspect);
  const soil = options.soil ? 
    (Array.isArray(options.soil) ? options.soil : [options.soil]) : 
    getRandomSoils(country, region);
  const altitude = options.altitude || getRandomAltitude(country, region);
  const acres = options.acres || getRandomAcres();
  
  const vineyard: Vineyard = {
    id,
    name,
    country,
    region,
    acres,
    grape: options.grape || null,
    vineAge: options.vineAge || 0,
    soil,
    altitude,
    aspect,
    density: options.density || 5000,
    vineyardHealth: options.vineyardHealth || 0.5,
    landValue: calculateLandValue(country, region, altitude, aspect),
    status: options.status || 'Ready to be planted',
    ripeness: options.ripeness || 0.0,
    vineyardPrestige: 0, // Will be calculated
    canBeCleared: options.canBeCleared ?? true,
    annualYieldFactor: options.annualYieldFactor || (0.75 + Math.random()),
    annualQualityFactor: options.annualQualityFactor || Math.random(),
    farmingMethod: options.farmingMethod || "Non-Conventional",
    organicYears: options.organicYears || 0,
    remainingYield: options.remainingYield === undefined ? null : options.remainingYield,
    ownedSince: options.ownedSince || new Date()
  };
  
  // Calculate prestige after all other properties are set
  vineyard.vineyardPrestige = calculateVineyardPrestige(vineyard);
  
  return vineyard;
}

// Helper functions

function getRandomFromObject<T>(obj: Record<string, T>): string {
  const keys = Object.keys(obj);
  return keys[Math.floor(Math.random() * keys.length)];
}

function getRandomFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomAspect(): Aspect {
  const aspects: Aspect[] = [
    "North", "Northeast", "East", "Southeast", 
    "South", "Southwest", "West", "Northwest"
  ];
  return getRandomFromArray(aspects);
}

function generateVineyardName(country: string, aspect: Aspect): string {
  // Placeholder for name generation
  // In the actual implementation, we would use the name generation logic from the old codebase
  return `${country} ${aspect} Vineyard`;
}

function getRandomSoils(country: string, region: string): string[] {
  const soils = regionSoilTypes[country][region];
  const numberOfSoils = Math.floor(Math.random() * 3) + 1; // 1-3 soil types
  const selectedSoils = new Set<string>();

  while (selectedSoils.size < numberOfSoils && selectedSoils.size < soils.length) {
    selectedSoils.add(getRandomFromArray(soils));
  }

  return Array.from(selectedSoils);
}

function getRandomAltitude(country: string, region: string): number {
  const [min, max] = regionAltitudeRanges[country][region];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomAcres(): number {
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

  return Number(acres.toFixed(2));
} 