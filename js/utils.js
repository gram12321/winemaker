import { convertToCurrentUnit, getUnit } from './settings.js';
import { regionSoilTypes } from './names.js';

export function getFlagIcon(countryName) {
  const countryToFlagCode = {
    "Italy": "it",
    "France": "fr",
    "Spain": "es",
    "US": "us",  // Use 'us' for the United States
    "Germany": "de",
  };

  // Handle "United States" specifically
  const flagCode = countryToFlagCode[countryName] || (countryName === "United States" ? "us" : null);

  // Return the HTML for the flag icon
  return flagCode 
    ? `<span class="flag-icon flag-icon-${flagCode}" style="vertical-align: middle; margin-right: 5px;"></span>`
    : ''; // Return an empty string if no flag is found
}

export function getFlagIconHTML(country) {
    return getFlagIcon(country);
}

export function getColorClass(value) {
  if (value >= 0.9) return 'color-class-9';
  if (value >= 0.8) return 'color-class-8';
  if (value >= 0.7) return 'color-class-7';
  if (value >= 0.6) return 'color-class-6';
  if (value >= 0.5) return 'color-class-5';
  if (value >= 0.4) return 'color-class-4';
  if (value >= 0.3) return 'color-class-3';
  if (value >= 0.2) return 'color-class-2';
  if (value >= 0.1) return 'color-class-1';
  return 'color-class-0'; // This handles 0 as well
}

export function getWineQualityCategory(quality) {
  if (quality < 0.1) return "Undrinkable";
  if (quality < 0.2) return "Vinegar Surprise";
  if (quality < 0.3) return "House Pour";
  if (quality < 0.4) return "Everyday Sipper";
  if (quality < 0.5) return "Solid Bottle";
  if (quality < 0.6) return "Well-Balanced";
  if (quality < 0.7) return "Sommelier's Choice";
  if (quality < 0.8) return "Cellar Reserve";
  if (quality < 0.9) return "Connoisseur's Pick";
  return "Vintage Perfection";
}

export function formatQualityDisplay(quality) {
  const qualityDescription = getWineQualityCategory(quality);
  const colorClass = getColorClass(quality);
  return `${qualityDescription} <span class="${colorClass}">(${(quality * 100).toFixed(0)}%)</span>`;
}

export function getRandomSoil(country, region) {
  const soils = regionSoilTypes[country][region];
  return soils[Math.floor(Math.random() * soils.length)];
}

export function formatNumber(value, decimals = 0) {
    // Check if value is effectively zero (very small number)
    if (Math.abs(value) < 0.0005) return "0";
    
    const isNegative = value < 0;
    const absValue = Math.abs(value);
    let formattedValue;
    
    if (absValue >= 1_000_000) {
        // For values of one million or more
        formattedValue = `${(absValue / 1_000_000).toLocaleString('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} Mio`;
    } else {
        // For smaller amounts
        formattedValue = absValue.toLocaleString('de-DE', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
    
    return isNegative ? `-${formattedValue}` : formattedValue;
}

export function formatLandSizeWithUnit(acres) {
    const selectedUnit = getUnit(); // 'acres' or 'hectares'
    const convertedSize = convertToCurrentUnit(acres);
    return `${formatNumber(convertedSize)} ${selectedUnit}`;
}

export function extractSeasonAndYear(dateString) {
    const [week, season, year] = dateString.split(', ');
    return { season, year: parseInt(year) };
}
export function getPreviousSeasonAndYear(currentSeason, currentYear) {
    let previousSeason;
    let previousYear = currentYear;

    switch (currentSeason) {
        case "Spring":
            previousSeason = "Winter";
            previousYear -= 1;
            break;
        case "Summer":
            previousSeason = "Spring";
            break;
        case "Fall":
            previousSeason = "Summer";
            break;
        case "Winter":
            previousSeason = "Fall";
            break;
        default:
            console.error("Unknown current season");
            previousSeason = "Unknown Season";
    }

    return { previousSeason, previousYear };
}

export const experienceLevels = {
    1: { name: 'Fresh Off the Vine', modifier: 0.2, costMultiplier: 1 },
    2: { name: 'Cork Puller', modifier: 0.3, costMultiplier: 1.5 },
    3: { name: 'Cellar Hand', modifier: 0.4, costMultiplier: 2 },
    4: { name: 'Vine Whisperer', modifier: 0.5, costMultiplier: 3 },
    5: { name: 'Grape Sage', modifier: 0.6, costMultiplier: 4 },
    6: { name: 'Vintage Virtuoso', modifier: 0.7, costMultiplier: 6 },
    7: { name: 'Wine Wizard', modifier: 0.8, costMultiplier: 8 },
    8: { name: 'Terroir Master', modifier: 0.85, costMultiplier: 12 },
    9: { name: 'Vineyard Virtuoso', modifier: 0.9, costMultiplier: 16 },
    10: { name: 'Living Legend', modifier: 0.95, costMultiplier: 25 }
};

export function getExperienceLevelInfo(level) {
    return experienceLevels[level] || experienceLevels[1];
}