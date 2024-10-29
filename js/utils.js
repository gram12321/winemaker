// utils.js
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

// utils.js

/**
 * Function to get a color class based on a value from 0 to 1.
 * This function divides the range into 10 intervals (0.0 to 0.9).
 *
 * @param {number} value - A number between 0 and 1 inclusive.
 * @returns {string} - The corresponding color class.
 */
function getColorClass(value) {
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

// utils.js

import { regionSoilTypes } from './names.js';

/**
 * Get a random soil type for a given country and region.
 *
 * @param {string} country - The country name.
 * @param {string} region - The region name.
 * @returns {string} - A random soil type from the specified region.
 */
function getRandomSoil(country, region) {
  const soils = regionSoilTypes[country][region];
  return soils[Math.floor(Math.random() * soils.length)];
}

// Export the function for use in other parts of the application
export { getRandomSoil };

// Export the function for use in other parts of the application
export { getColorClass };