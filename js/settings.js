// settings.js
import { addConsoleMessage } from '/js/console.js';


document.addEventListener("DOMContentLoaded", () => {
    // Check if we are on the settings page by looking for a specific unique element
    const form = document.getElementById('settings-form');
    if (!form) {
        return;  // Exit if form is not found, meaning we are not on the settings page
    }

    const timeFormatSelect = document.getElementById('time-format');
    const showConsoleCheckbox = document.getElementById('show-console');
    const unitSelect = document.getElementById('land-unit');
    const feedback = document.getElementById('feedback');

    // Ensure elements are found before proceeding
    if (timeFormatSelect && showConsoleCheckbox && unitSelect) {
        // Load saved settings from localStorage
        const savedFormat = localStorage.getItem('timeFormat') || '24';
        const savedUnit = localStorage.getItem('landUnit') || 'acres';

        // Set the retrieved values to elements
        timeFormatSelect.value = savedFormat;
        showConsoleCheckbox.checked = localStorage.getItem('showConsole') === 'true';
        unitSelect.value = savedUnit;

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const selectedFormat = timeFormatSelect.value;
            const showConsole = showConsoleCheckbox.checked;
            const selectedUnit = unitSelect.value;

            localStorage.setItem('timeFormat', selectedFormat);
            localStorage.setItem('showConsole', showConsole);
            localStorage.setItem('landUnit', selectedUnit);

            // Console messages indicating changes
            addConsoleMessage(`Time format changed to ${selectedFormat === '24' ? '24-hour' : '12-hour (AM/PM)'} format.`);
            addConsoleMessage(`Console visibility set to ${showConsole ? 'show' : 'hide'}.`);
            addConsoleMessage(`Land unit set to ${selectedUnit === 'hectares' ? 'hectares' : 'acres'}.`);
        });
    } else {
        console.warn('One or more elements expected in settings.js could not be found');
    }
});

export const Units = {
  ACRES: 'acres',
  HECTARES: 'hectares'
};

let currentUnit = Units.ACRES; // Default unit

export function setUnit(unit) {
  if (Object.values(Units).includes(unit)) {
    currentUnit = unit;
    localStorage.setItem('landUnit', unit);
    addConsoleMessage(`Land unit set to ${unit === Units.HECTARES ? 'hectares' : 'acres'}.`);
  }
}

export function getUnit() {
  return currentUnit;
}

export function convertToCurrentUnit(valueInAcres) {
  if (currentUnit === Units.HECTARES) {
    return valueInAcres * 0.404686; // Convert acres to hectares
  }
  return valueInAcres;
}

// Initialize currentUnit from localStorage
currentUnit = localStorage.getItem('landUnit') || Units.ACRES;