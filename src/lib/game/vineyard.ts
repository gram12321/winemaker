import { GameDate, BASE_YIELD_PER_ACRE, BASELINE_VINE_DENSITY, CONVENTIONAL_YIELD_BONUS, DEFAULT_VINEYARD_HEALTH, ORGANIC_CERTIFICATION_YEARS } from '@/lib/core/constants/gameConstants';
import { GrapeVariety, Aspect, FarmingMethod, COUNTRY_REGION_MAP, REGION_SOIL_TYPES, REGION_ALTITUDE_RANGES, ASPECT_FACTORS, REGION_PRESTIGE_RANKINGS } from '@/lib/core/constants/vineyardConstants';
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
  upgrades?: string[];
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
  // We might need to revisit this if the old logic was more complex (using real price ranges etc.)
  // For now, keep it similar to the current implementation but ensure it uses constants.
  const baseValue = 1000; // Base value per acre (needs refinement based on old logic)

  // Region prestige factor
  const prestigeKey = `${region}, ${country}`;
  const regionPrestige = REGION_PRESTIGE_RANKINGS[prestigeKey] || 0.5; // Default to 0.5 if not found

  // Altitude factor
  const countryData = REGION_ALTITUDE_RANGES[country as keyof typeof REGION_ALTITUDE_RANGES];
  const altitudeRange: [number, number] = countryData ? (countryData[region as keyof typeof countryData] as [number, number] || [0, 100]) : [0, 100];
  const altitudeFactor = normalizeAltitude(altitude, altitudeRange); // Use the existing normalize function

  // Aspect factor
  const aspectFactor = ASPECT_FACTORS[aspect] || 0.5; // Use the existing ASPECT_FACTORS

  // Combine factors - adjust multipliers as needed to match old balance
  // This needs careful calibration based on how 'regionRealPriceRanges' was used previously.
  // A simple multiplicative approach:
  return Math.round(baseValue * (1 + regionPrestige) * (1 + altitudeFactor) * (1 + aspectFactor));
}

export function normalizeAltitude(altitude: number, range: [number, number]): number {
  const [min, max] = range;
  if (altitude < min) return 0.1;
  if (altitude > max) return 1.0;
  return 0.1 + 0.9 * ((altitude - min) / (max - min));
}

export function calculateVineyardPrestige(vineyard: Vineyard): number {
  // Age contribution (30%) - Needs refinement if old logic was different
  const ageContribution = calculateAgeContribution(vineyard.vineAge); // Existing function

  // Land value contribution (25%) - Refined to use new landValue
  const landValueContribution = calculateLandValueContribution(vineyard.landValue); // Existing function (may need adjustment based on new landValue range)

  // Region prestige contribution (25%) - Refined
  const prestigeRankingContribution = calculateRegionPrestigeContribution(vineyard.region, vineyard.country); // Existing function

  // Grape variety suitability (20%) - Placeholder remains
  const grapeContribution = calculateGrapeSuitabilityContribution(vineyard.grape, vineyard.region, vineyard.country); // Existing function

  const finalPrestige = (
    (ageContribution * 0.30) +
    (landValueContribution * 0.25) +
    (prestigeRankingContribution * 0.25) +
    (grapeContribution * 0.20)
  ) || 0.01; // Ensure weights sum to 1.0

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

// Refine normalization if needed based on the output range of calculateLandValue
function calculateLandValueContribution(landValue: number): number {
  // Normalize land value between 0 and 1
  // Example: If max expected land value is ~50000
  const MAX_CONSIDERED_LAND_VALUE = 50000; // Adjust this based on expected values
  const normalizedValue = Math.min(landValue / MAX_CONSIDERED_LAND_VALUE, 1);
  return normalizedValue; // Weighting happens in calculateVineyardPrestige
}

function calculateRegionPrestigeContribution(region: string, country: string): number {
  // Use the migrated REGION_PRESTIGE_RANKINGS
  const prestigeKey = `${region}, ${country}`;
  return REGION_PRESTIGE_RANKINGS[prestigeKey] || 0.5; // Default if not found, weighting happens later
}

// TODO: Implement grape suitability logic if desired (using grapeSuitability from old names.js)
function calculateGrapeSuitabilityContribution(grape: GrapeVariety | null, region: string, country: string): number {
  if (!grape) return 0;
  // Placeholder - requires migrating and using grapeSuitability data
  // const suitabilityData = grapeSuitability[country]?.[region]?.[grape];
  // return suitabilityData || 0.5; // Default suitability
  return 0.8; // Placeholder value, weighting happens later
}

export function createVineyard(id: string, options: Partial<Vineyard> = {}): Vineyard {
  const country = options.country || getRandomFromObject(COUNTRY_REGION_MAP);
  const countryRegions = COUNTRY_REGION_MAP[country as keyof typeof COUNTRY_REGION_MAP];
  const region = options.region || (countryRegions ? getRandomFromArray(countryRegions) : "");
  const aspect = options.aspect || getRandomAspect();
  const name = options.name || generateVineyardName(country, aspect); // Keep placeholder name gen
  const soil = options.soil ? (Array.isArray(options.soil) ? options.soil : [options.soil]) : getRandomSoils(country, region);
  const altitude = options.altitude || getRandomAltitude(country, region);
  const acres = options.acres || getRandomAcres();

  const { week, season, currentYear } = getGameState();
  const ownedSince: GameDate = options.ownedSince || { week, season, year: currentYear };

  // Determine initial farming method - Default to Non-Conventional?
  const initialFarmingMethod = options.farmingMethod || "Non-Conventional";

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
    density: options.density || 0, // Default density to 0 if not planted
    vineyardHealth: options.vineyardHealth || DEFAULT_VINEYARD_HEALTH, // Use constant
    landValue: 0, // Will be calculated below
    status: options.status || 'Ready to be planted',
    ripeness: options.ripeness || 0.0,
    vineyardPrestige: 0, // Will be calculated below
    canBeCleared: options.canBeCleared ?? true, // Default to true
    annualYieldFactor: options.annualYieldFactor || (0.75 + Math.random()), // Keep random for now
    annualQualityFactor: options.annualQualityFactor || Math.random(), // Keep random for now
    farmingMethod: initialFarmingMethod, // Initialize new field
    organicYears: options.organicYears || (initialFarmingMethod === 'Ecological' ? ORGANIC_CERTIFICATION_YEARS : 0), // Initialize new field
    remainingYield: options.remainingYield === undefined ? null : options.remainingYield,
    ownedSince,
    upgrades: options.upgrades || [], // Initialize new field
  };

  // Calculate land value after other properties are set
  vineyard.landValue = calculateLandValue(vineyard.country, vineyard.region, vineyard.altitude, vineyard.aspect);

  // Calculate prestige after land value is set
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
