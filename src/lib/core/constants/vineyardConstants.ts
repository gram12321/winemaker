/**
 * Vineyard Constants
 * Data for vineyard locations, soil types, altitudes, etc.
 */

import { Season } from './gameConstants';

// Grape varieties - Reverted to original 5
export type GrapeVariety =
  | "Barbera"
  | "Chardonnay"
  | "Pinot Noir"
  | "Primitivo"
  | "Sauvignon Blanc";

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

// Countries and regions data
export const COUNTRY_REGION_MAP = {
  "France": ["Bordeaux", "Burgundy (Bourgogne)", "Champagne", "Loire Valley", "Rhone Valley", "Jura"],
  "Germany": ["Ahr", "Mosel", "Pfalz", "Rheingau", "Rheinhessen"],
  "Italy": ["Piedmont", "Puglia", "Sicily", "Tuscany", "Veneto"],
  "Spain": ["Jumilla", "La Mancha", "Ribera del Duero", "Rioja", "Sherry (Jerez)"],
  "United States": ["Central Coast (California)", "Finger Lakes (New York)", "Napa Valley (California)", "Sonoma County (California)", "Willamette Valley (Oregon)"],
};

// Soil types by region
export const REGION_SOIL_TYPES = {
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
export const REGION_ALTITUDE_RANGES = {
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

// Aspect factors for land value calculation
export const ASPECT_FACTORS = {
  "South": 1.0,
  "Southeast": 0.9,
  "Southwest": 0.9,
  "East": 0.7,
  "West": 0.7,
  "Northeast": 0.5,
  "Northwest": 0.5,
  "North": 0.3
};

// Migrated from names.js
export const REGION_PRESTIGE_RANKINGS: { [key: string]: number } = {
  "Burgundy (Bourgogne), France": 1.00,
  "Champagne, France": 0.98,
  "Napa Valley (California), United States": 0.90,
  "Bordeaux, France": 0.87,
  "Tuscany, Italy": 0.83,
  "Piedmont, Italy": 0.80,
  "Sonoma County (California), United States": 0.76,
  "Rheingau, Germany": 0.73,
  "Mosel, Germany": 0.72,
  "Rioja, Spain": 0.70,
  "Willamette Valley (Oregon), United States": 0.67,
  "Ribera del Duero, Spain": 0.65,
  "Jura, France": 0.65,
  "Central Coast (California), United States": 0.63,
  "Loire Valley, France": 0.61,
  "Rhone Valley, France": 0.60,
  "Pfalz, Germany": 0.57,
  "Veneto, Italy": 0.55,
  "Sherry (Jerez), Spain": 0.51,
  "Finger Lakes (New York), United States": 0.48,
  "Sicily, Italy": 0.46,
  "La Mancha, Spain": 0.42,
  "Ahr, Germany": 0.41,
  "Jumilla, Spain": 0.39,
  "Rheinhessen, Germany": 0.37,
  "Puglia, Italy": 0.35
};

// Grape Suitability Data (Migrated from names.js)
export const GRAPE_SUITABILITY = {
  Italy: {
    Piedmont: { Barbera: 1.0, Chardonnay: 0.8, 'Pinot Noir': 0.6, Primitivo: 0.5, 'Sauvignon Blanc': 0.6 },
    Tuscany: { Barbera: 0.9, Chardonnay: 0.7, 'Pinot Noir': 0.5, Primitivo: 0.7, 'Sauvignon Blanc': 0.7 },
    Veneto: { Barbera: 0.85, Chardonnay: 0.75, 'Pinot Noir': 0.7, Primitivo: 0.6, 'Sauvignon Blanc': 0.8 },
    Sicily: { Barbera: 0.8, Chardonnay: 0.6, 'Pinot Noir': 0.3, Primitivo: 0.8, 'Sauvignon Blanc': 0.5 },
    Puglia: { Barbera: 0.9, Chardonnay: 0.65, 'Pinot Noir': 0.4, Primitivo: 1.0, 'Sauvignon Blanc': 0.4 }
  },
  France: {
    Bordeaux: { Barbera: 0.7, Chardonnay: 0.8, 'Pinot Noir': 0.6, Primitivo: 0.6, 'Sauvignon Blanc': 0.9 },
    "Burgundy (Bourgogne)": { Barbera: 0.4, Chardonnay: 1.0, 'Pinot Noir': 0.9, Primitivo: 0.3, 'Sauvignon Blanc': 0.7 },
    Champagne: { Barbera: 0.2, Chardonnay: 0.9, 'Pinot Noir': 0.8, Primitivo: 0.2, 'Sauvignon Blanc': 0.6 },
    "Loire Valley": { Barbera: 0.35, Chardonnay: 0.85, 'Pinot Noir': 0.7, Primitivo: 0.3, 'Sauvignon Blanc': 1.0 },
    "Rhone Valley": { Barbera: 0.85, Chardonnay: 0.75, 'Pinot Noir': 0.5, Primitivo: 0.7, 'Sauvignon Blanc': 0.7 },
    "Jura": { Barbera: 0.3, Chardonnay: 0.9, 'Pinot Noir': 0.8, Primitivo: 0.2, 'Sauvignon Blanc': 0.6 },
  },
  Spain: {
    Rioja: { Barbera: 0.85, Chardonnay: 0.7, 'Pinot Noir': 0.4, Primitivo: 0.5, 'Sauvignon Blanc': 0.6 },
    "Ribera del Duero": { Barbera: 0.8, Chardonnay: 0.6, 'Pinot Noir': 0.35, Primitivo: 0.4, 'Sauvignon Blanc': 0.5 },
    Jumilla: { Barbera: 0.9, Chardonnay: 0.5, 'Pinot Noir': 0.3, Primitivo: 0.85, 'Sauvignon Blanc': 0.4 },
    "La Mancha": { Barbera: 0.85, Chardonnay: 0.55, 'Pinot Noir': 0.25, Primitivo: 0.8, 'Sauvignon Blanc': 0.5 },
    "Sherry (Jerez)": { Barbera: 0.8, Chardonnay: 0.5, 'Pinot Noir': 0.2, Primitivo: 0.7, 'Sauvignon Blanc': 0.4 },
  },
  "United States": {
    "Napa Valley (California)": { Barbera: 0.9, Chardonnay: 1.0, 'Pinot Noir': 0.7, Primitivo: 0.85, 'Sauvignon Blanc': 0.8 },
    "Sonoma County (California)": { Barbera: 0.85, Chardonnay: 0.95, 'Pinot Noir': 0.75, Primitivo: 0.8, 'Sauvignon Blanc': 0.7 },
    "Willamette Valley (Oregon)": { Barbera: 0.4, Chardonnay: 0.85, 'Pinot Noir': 1.0, Primitivo: 0.3, 'Sauvignon Blanc': 0.6 },
    "Finger Lakes (New York)": { Barbera: 0.3, Chardonnay: 0.7, 'Pinot Noir': 0.75, Primitivo: 0.2, 'Sauvignon Blanc': 0.5 },
    "Central Coast (California)": { Barbera: 0.85, Chardonnay: 0.8, 'Pinot Noir': 0.6, Primitivo: 0.75, 'Sauvignon Blanc': 0.7 },
  },
  Germany: {
    Mosel: { Barbera: 0.15, Chardonnay: 0.8, 'Pinot Noir': 1.0, Primitivo: 0.1, 'Sauvignon Blanc': 0.8 },
    Rheingau: { Barbera: 0.2, Chardonnay: 0.85, 'Pinot Noir': 0.9, Primitivo: 0.15, 'Sauvignon Blanc': 0.85 },
    Rheinhessen: { Barbera: 0.25, Chardonnay: 0.8, 'Pinot Noir': 0.85, Primitivo: 0.2, 'Sauvignon Blanc': 0.8 },
    Pfalz: { Barbera: 0.3, Chardonnay: 0.75, 'Pinot Noir': 0.8, Primitivo: 0.25, 'Sauvignon Blanc': 0.75 },
    Ahr: { Barbera: 0.1, Chardonnay: 0.7, 'Pinot Noir': 0.95, Primitivo: 0.1, 'Sauvignon Blanc': 0.6 },
  },
};

// Real Price Range per Hectare (Migrated from names.js)
export const REGION_REAL_PRICE_RANGES = {
  "Burgundy (Bourgogne), France": [1000000, 10000000],
  "Champagne, France": [500000, 2000000],
  "Napa Valley (California), United States": [300000, 1000000],
  "Bordeaux, France": [100000, 2000000],
  "Tuscany, Italy": [80000, 1000000],
  "Piedmont, Italy": [50000, 700000],
  "Sonoma County (California), United States": [100000, 500000],
  "Rheingau, Germany": [50000, 200000],
  "Mosel, Germany": [30000, 150000],
  "Rioja, Spain": [30000, 100000],
  "Willamette Valley (Oregon), United States": [50000, 250000],
  "Ribera del Duero, Spain": [30000, 80000],
  "Central Coast (California), United States": [20000, 150000],
  "Loire Valley, France": [20000, 80000],
  "Rhone Valley, France": [30000, 120000],
  "Pfalz, Germany": [15000, 60000],
  "Veneto, Italy": [20000, 100000],
  "Sherry (Jerez), Spain": [10000, 40000],
  "Finger Lakes (New York), United States": [10000, 50000],
  "Sicily, Italy": [10000, 60000],
  "La Mancha, Spain": [5000, 30000],
  "Ahr, Germany": [20000, 50000],
  "Jumilla, Spain": [5000, 25000],
  "Rheinhessen, Germany": [10000, 40000],
  "Puglia, Italy": [5000, 30000],
  "Jura, France": [25000, 45000], 
};

// Base Characteristics for Grapes (Migrated from resource.js)
// Values represent absolute position on a 0-1 scale (0.5 is midpoint)
const baseGrapeCharacteristics = {
  'Barbera':        { acidity: 0.7,  aroma: 0.5,  body: 0.6,  spice: 0.5,  sweetness: 0.5,  tannins: 0.6  }, // acidity: 0.5+0.2, body: 0.5+0.1, tannins: 0.5+0.1
  'Chardonnay':     { acidity: 0.4,  aroma: 0.65, body: 0.75, spice: 0.5,  sweetness: 0.5,  tannins: 0.35 }, // acidity: 0.5-0.1, aroma: 0.5+0.15, body: 0.5+0.25, tannins: 0.5-0.15
  'Pinot Noir':     { acidity: 0.65, aroma: 0.6,  body: 0.35, spice: 0.5,  sweetness: 0.5,  tannins: 0.4  }, // acidity: 0.5+0.15, aroma: 0.5+0.1, body: 0.5-0.15, tannins: 0.5-0.1
  'Primitivo':      { acidity: 0.5,  aroma: 0.7,  body: 0.7,  spice: 0.5,  sweetness: 0.7,  tannins: 0.7  }, // aroma: 0.5+0.2, body: 0.5+0.2, sweetness: 0.5+0.2, tannins: 0.5+0.2
  'Sauvignon Blanc':{ acidity: 0.8,  aroma: 0.75, body: 0.3,  spice: 0.6,  sweetness: 0.4,  tannins: 0.3  }  // acidity: 0.5+0.3, aroma: 0.5+0.25, body: 0.5-0.2, spice: 0.5+0.1, sweetness: 0.5-0.1, tannins: 0.5-0.2
};

export interface GrapeWineCharacteristics {
  acidity: number;
  aroma: number;
  body: number;
  spice: number;
  sweetness: number;
  tannins: number;
}

export interface Resource {
  name: GrapeVariety;
  naturalYield: number; 
  fragile: number;      
  proneToOxidation: number; 
  grapeColor: 'red' | 'white';
  baseCharacteristics: GrapeWineCharacteristics; // Added base characteristics
}

// Add baseCharacteristics to the resource data
const grapeResourceData: Record<GrapeVariety, Resource> = {
  "Barbera":        { name: "Barbera",        naturalYield: 0.7, fragile: 0.4, proneToOxidation: 0.4, grapeColor: 'red',   baseCharacteristics: baseGrapeCharacteristics['Barbera'] },
  "Chardonnay":     { name: "Chardonnay",     naturalYield: 0.8, fragile: 0.6, proneToOxidation: 0.7, grapeColor: 'white', baseCharacteristics: baseGrapeCharacteristics['Chardonnay'] },
  "Pinot Noir":     { name: "Pinot Noir",     naturalYield: 0.6, fragile: 0.7, proneToOxidation: 0.8, grapeColor: 'red',   baseCharacteristics: baseGrapeCharacteristics['Pinot Noir'] },
  "Primitivo":      { name: "Primitivo",      naturalYield: 0.9, fragile: 0.3, proneToOxidation: 0.3, grapeColor: 'red',   baseCharacteristics: baseGrapeCharacteristics['Primitivo'] },
  "Sauvignon Blanc":{ name: "Sauvignon Blanc",naturalYield: 0.75, fragile: 0.5, proneToOxidation: 0.9, grapeColor: 'white', baseCharacteristics: baseGrapeCharacteristics['Sauvignon Blanc'] },
};

/**
 * Gets resource data for a given grape variety.
 */
export function getResourceByGrapeVariety(grapeName: GrapeVariety | null | undefined): Resource | undefined {
  if (!grapeName) return undefined;
  return grapeResourceData[grapeName];
}
// --- End Resource Definitions --- 

// Universal Base Balanced Ranges for Wine Characteristics
export const BASE_BALANCED_RANGES: Record<keyof GrapeWineCharacteristics, [number, number]> = {
  acidity: [0.4, 0.6],
  aroma: [0.3, 0.7],
  body: [0.4, 0.8],
  spice: [0.35, 0.65],
  sweetness: [0.4, 0.6],
  tannins: [0.35, 0.65]
};

// Aspect Ratings by Region (Migrated from names.js)
export const REGION_ASPECT_RATINGS = {
  "Italy": {
    "Piedmont": { "North": 0.25, "Northeast": 0.45, "East": 0.65, "Southeast": 1.00, "South": 0.90, "Southwest": 0.80, "West": 0.60, "Northwest": 0.40 },
    "Tuscany": { "North": 0.30, "Northeast": 0.55, "East": 0.75, "Southeast": 1.00, "South": 0.90, "Southwest": 0.85, "West": 0.70, "Northwest": 0.50 },
    "Veneto": { "North": 0.20, "Northeast": 0.40, "East": 0.60, "Southeast": 0.95, "South": 1.00, "Southwest": 0.85, "West": 0.65, "Northwest": 0.35 },
    "Sicily": { "North": 0.45, "Northeast": 0.65, "East": 0.85, "Southeast": 1.00, "South": 0.90, "Southwest": 0.80, "West": 0.70, "Northwest": 0.55 },
    "Puglia": { "North": 0.50, "Northeast": 0.65, "East": 0.85, "Southeast": 1.00, "South": 0.90, "Southwest": 0.85, "West": 0.75, "Northwest": 0.55 },
  },
  "France": {
    "Bordeaux": { "North": 0.30, "Northeast": 0.40, "East": 0.60, "Southeast": 0.85, "South": 1.00, "Southwest": 0.95, "West": 0.80, "Northwest": 0.50 },
    "Burgundy (Bourgogne)": { "North": 0.25, "Northeast": 0.45, "East": 0.65, "Southeast": 1.00, "South": 0.90, "Southwest": 0.80, "West": 0.55, "Northwest": 0.40 },
    "Champagne": { "North": 0.20, "Northeast": 0.35, "East": 0.55, "Southeast": 0.90, "South": 1.00, "Southwest": 0.80, "West": 0.60, "Northwest": 0.35 },
    "Loire Valley": { "North": 0.30, "Northeast": 0.50, "East": 0.65, "Southeast": 0.85, "South": 1.00, "Southwest": 0.90, "West": 0.75, "Northwest": 0.45 },
    "Rhone Valley": { "North": 0.25, "Northeast": 0.50, "East": 0.70, "Southeast": 1.00, "South": 0.90, "Southwest": 0.85, "West": 0.65, "Northwest": 0.40 },
    "Jura": { "North": 0.20, "Northeast": 0.45, "East": 0.65, "Southeast": 0.95, "South": 1.00, "Southwest": 0.85, "West": 0.60, "Northwest": 0.35 },
  },
  "Spain": {
    "Rioja": { "North": 0.40, "Northeast": 0.55, "East": 0.75, "Southeast": 0.85, "South": 1.00, "Southwest": 0.90, "West": 0.80, "Northwest": 0.60 },
    "Ribera del Duero": { "North": 0.35, "Northeast": 0.60, "East": 0.80, "Southeast": 0.90, "South": 1.00, "Southwest": 0.85, "West": 0.70, "Northwest": 0.55 },
    "Jumilla": { "North": 0.50, "Northeast": 0.65, "East": 0.85, "Southeast": 1.00, "South": 0.90, "Southwest": 0.80, "West": 0.70, "Northwest": 0.60 },
    "La Mancha": { "North": 0.45, "Northeast": 0.60, "East": 0.85, "Southeast": 1.00, "South": 0.90, "Southwest": 0.80, "West": 0.75, "Northwest": 0.50 },
    "Sherry (Jerez)": { "North": 0.50, "Northeast": 0.70, "East": 0.85, "Southeast": 1.00, "South": 0.90, "Southwest": 0.85, "West": 0.80, "Northwest": 0.60 },
  },
  "United States": {
    "Napa Valley (California)": { "North": 0.40, "Northeast": 0.65, "East": 0.85, "Southeast": 1.00, "South": 0.90, "Southwest": 0.85, "West": 0.75, "Northwest": 0.60 },
    "Sonoma County (California)": { "North": 0.35, "Northeast": 0.60, "East": 0.80, "Southeast": 1.00, "South": 0.90, "Southwest": 0.85, "West": 0.75, "Northwest": 0.55 },
    "Willamette Valley (Oregon)": { "North": 0.20, "Northeast": 0.45, "East": 0.70, "Southeast": 0.85, "South": 1.00, "Southwest": 0.90, "West": 0.65, "Northwest": 0.35 },
    "Finger Lakes (New York)": { "North": 0.25, "Northeast": 0.50, "East": 0.70, "Southeast": 0.85, "South": 1.00, "Southwest": 0.85, "West": 0.75, "Northwest": 0.45 },
    "Central Coast (California)": { "North": 0.35, "Northeast": 0.60, "East": 0.80, "Southeast": 1.00, "South": 0.90, "Southwest": 0.85, "West": 0.70, "Northwest": 0.50 },
  },
  "Germany": {
    "Mosel": { "North": 0.15, "Northeast": 0.35, "East": 0.65, "Southeast": 0.95, "South": 1.00, "Southwest": 0.85, "West": 0.60, "Northwest": 0.30 },
    "Rheingau": { "North": 0.20, "Northeast": 0.50, "East": 0.70, "Southeast": 0.90, "South": 1.00, "Southwest": 0.85, "West": 0.75, "Northwest": 0.40 },
    "Rheinhessen": { "North": 0.25, "Northeast": 0.60, "East": 0.80, "Southeast": 0.90, "South": 1.00, "Southwest": 0.85, "West": 0.70, "Northwest": 0.50 },
    "Pfalz": { "North": 0.30, "Northeast": 0.65, "East": 0.80, "Southeast": 0.90, "South": 1.00, "Southwest": 0.85, "West": 0.70, "Northwest": 0.50 },
    "Ahr": { "North": 0.10, "Northeast": 0.40, "East": 0.65, "Southeast": 0.85, "South": 1.00, "Southwest": 0.80, "West": 0.65, "Northwest": 0.35 },
  },
}; 