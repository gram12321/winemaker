/**
 * Vineyard Constants
 * Data for vineyard locations, soil types, altitudes, etc.
 */

import { Season } from './gameConstants';

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