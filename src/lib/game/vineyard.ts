import { GameDate, BASE_YIELD_PER_ACRE, BASELINE_VINE_DENSITY, CONVENTIONAL_YIELD_BONUS } from '@/lib/core/constants';
import { GrapeVariety, Aspect, FarmingMethod, COUNTRY_REGION_MAP, REGION_SOIL_TYPES, REGION_ALTITUDE_RANGES, ASPECT_FACTORS } from '@/lib/core/constants';
import { getGameState } from '@/gameState';

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
  ownedSince: GameDate;
}

export function calculateVineyardYield(vineyard: Vineyard): number {
  if (!vineyard.grape || vineyard.annualYieldFactor === 0 || vineyard.status === 'Harvested') {
    return 0;
  }

  const densityModifier = vineyard.density / BASELINE_VINE_DENSITY;
  const qualityMultiplier = (vineyard.ripeness + vineyard.vineyardHealth) / 2;
  let expectedYield = BASE_YIELD_PER_ACRE * vineyard.acres * qualityMultiplier * vineyard.annualYieldFactor * densityModifier;
  
  // Apply bonus multiplier if conventional
  if (vineyard.farmingMethod === 'Conventional') {
    expectedYield *= CONVENTIONAL_YIELD_BONUS;
  }

  return expectedYield;
}

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
  const baseValue = 1000;
  
  // Region prestige factor (would be based on regionPrestigeRankings)
  const prestigeFactor = 1.0;
  
  // Altitude factor - use type assertion to handle indexing
  const countryData = REGION_ALTITUDE_RANGES[country as keyof typeof REGION_ALTITUDE_RANGES];
  const altitudeRange: [number, number] = countryData ? (countryData[region as keyof typeof countryData] as [number, number] || [0, 100]) : [0, 100];
  const altitudeFactor = normalizeAltitude(altitude, altitudeRange);
  
  // Aspect factor
  // Typically south-facing slopes are most valuable, north-facing least valuable
  const aspectFactor = ASPECT_FACTORS[aspect] || 0.5;
  
  return baseValue * prestigeFactor * altitudeFactor * aspectFactor;
}

export function normalizeAltitude(altitude: number, range: [number, number]): number {
  const [min, max] = range;
  if (altitude < min) return 0.1;
  if (altitude > max) return 1.0;
  return 0.1 + 0.9 * ((altitude - min) / (max - min));
}

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

export function createVineyard(id: string, options: Partial<Vineyard> = {}): Vineyard {
  const country = options.country || getRandomFromObject(COUNTRY_REGION_MAP);
  
  // Handle country data with type assertion
  const countryRegions = COUNTRY_REGION_MAP[country as keyof typeof COUNTRY_REGION_MAP];
  const region = options.region || (countryRegions ? getRandomFromArray(countryRegions) : "");
  
  const aspect = options.aspect || getRandomAspect();
  const name = options.name || generateVineyardName(country, aspect);
  
  // Get soil data
  const soil = options.soil ? 
    (Array.isArray(options.soil) ? options.soil : [options.soil]) : 
    getRandomSoils(country, region);
  
  const altitude = options.altitude || getRandomAltitude(country, region);
  const acres = options.acres || getRandomAcres();
  
  // Get current game state for the game date
  const { week, season, currentYear } = getGameState();
  

  const ownedSince: GameDate = options.ownedSince || {
    week,
    season,
    year: currentYear
  };
  
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
    density: options.density || BASELINE_VINE_DENSITY,
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
    ownedSince
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
    "North", "Northeast", "East", "Southeast", "South", "Southwest", "West", "Northwest"
  ];
  return getRandomFromArray(aspects);
}

function generateVineyardName(country: string, aspect: Aspect): string {
  // Placeholder for name generation
  // In the actual implementation, we would use the name generation logic from the old codebase
  return `${country} ${aspect} Vineyard`;
}

function getRandomSoils(country: string, region: string): string[] {
  // Handle country data with type assertion
  const countryData = REGION_SOIL_TYPES[country as keyof typeof REGION_SOIL_TYPES];
  const soils = countryData ? countryData[region as keyof typeof countryData] || [] : [];
  
  const numberOfSoils = Math.floor(Math.random() * 3) + 1; // 1-3 soil types
  const selectedSoils = new Set<string>();

  while (selectedSoils.size < numberOfSoils && selectedSoils.size < soils.length) {
    selectedSoils.add(getRandomFromArray(soils));
  }

  return Array.from(selectedSoils);
}

function getRandomAltitude(country: string, region: string): number {
  // Handle country data with type assertion
  const countryData = REGION_ALTITUDE_RANGES[country as keyof typeof REGION_ALTITUDE_RANGES];
  const altitudeRange: [number, number] = countryData ? (countryData[region as keyof typeof countryData] as [number, number] || [0, 100]) : [0, 100];
  const [min, max] = altitudeRange;
  
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
