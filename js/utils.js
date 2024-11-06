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
  if (quality < 0.1) return "undrinkable";
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

export function getRandomSoil(country, region) {
  const soils = regionSoilTypes[country][region];
  return soils[Math.floor(Math.random() * soils.length)];
}

export function formatNumber(value, decimals = 0) {
    if (value >= 1_000_000) {
        // For values of one million or more
        return `${(value / 1_000_000).toLocaleString('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} Mio`;
    } else {
        // For smaller amounts
        return value.toLocaleString('de-DE', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
}

export function getFlagIconHTML(country) {
    return getFlagIcon(country);
}

export function formatLandSizeWithUnit(acres) {
    const selectedUnit = getUnit(); // 'acres' or 'hectares'
    const convertedSize = convertToCurrentUnit(acres);
    return `${formatNumber(convertedSize)} ${selectedUnit}`;
}

export function calculateWorkApplied(taskStaff) {
    let workApplied = 0;
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const tasks = JSON.parse(localStorage.getItem('tasks')) || []; // Load all tasks to count assignments

    taskStaff.forEach(staffId => {
        const staffMember = staffData.find(staff => staff.id.toString() === staffId);
        if (staffMember) {
            // Count how many tasks this staff member is assigned to
            const taskCount = tasks.reduce((count, task) => {
                if (task.staff && task.staff.includes(staffId.toString())) {
                    return count + 1;
                }
                return count;
            }, 0);

            // Calculate the work applied, dividing by the number of tasks
            if (taskCount > 0) {
                workApplied += staffMember.workforce / taskCount;
            }
        }
    });

    return workApplied;
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