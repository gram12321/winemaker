// endDay.js
import { addConsoleMessage } from './console.js';
import { renderCompanyInfo } from './database/loadSidebar.js';
import { inventoryInstance, displayInventory } from './resource.js'; // Import needed functions
import { saveInventory } from './database/adminFunctions.js';
import { executeAllTasks } from './loadPanel.js'
import { processRecurringTransactions, addTransaction } from './finance.js';
import { handleBookkeepingTask  } from './administration.js';
import { Farmland } from './farmland.js';  // Ensure the correct relative path is used

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

// Define the new function incrementWeek
export function incrementWeek() {
    // Retrieve the current week, season, and year from localStorage
    let currentWeek = parseInt(localStorage.getItem('week'), 10) || 1;
    let currentSeasonIndex = SEASONS.indexOf(localStorage.getItem('season')) || 0;
    let currentYear = parseInt(localStorage.getItem('year'), 10) || 2023;

    // Increment the week
    currentWeek += 1;

    // Check if the week exceeds 12, which indicates a change of season
    if (currentWeek > 12) {
        currentWeek = 1; // Reset the week to 1
        currentSeasonIndex = (currentSeasonIndex + 1) % SEASONS.length; // Move to the next season
    }

    // Only increment the year if we are back to the first week of Spring
    if (currentSeasonIndex === 0 && currentWeek === 1) {
        currentYear += 1;
    }

    // Check if it's the start of a new season
    if (currentWeek === 1) {
        handleBookkeepingTask(); // Initialize the bookkeeping task
    }

    // Update the local storage with the new values for week, season, and year
    localStorage.setItem('week', currentWeek);
    localStorage.setItem('season', SEASONS[currentSeasonIndex]);
    localStorage.setItem('year', currentYear);

    // Log the change to console and update any UI elements
    addConsoleMessage(`New week: <strong>Week ${currentWeek}, ${SEASONS[currentSeasonIndex]}, ${currentYear}</strong>`);
    renderCompanyInfo();

    // Execute any pending tasks for the week
    executeAllTasks();
    updateFieldStatuses();
    updateRipeness();
    // Process recurring transactions based on updated week
    processRecurringTransactions(currentWeek);
}

function updateNewYear(field) {
  // Log the current vine age and calculated prestige before updating
  console.log(`Before update: ${field.name} - Vine Age: ${field.vineAge}, Prestige: ${field.farmlandPrestige}`);

  if (field.plantedResourceName && field.vineAge != null) {
    field.vineAge += 1; // Increment vine age
  }

  // Recalculate and log prestige after updating the vine age
  console.log(`After update: ${field.name} - Vine Age: ${field.vineAge}, Prestige: ${field.farmlandPrestige}`);
}

// Usage within your existing seasonal cycle logic
function updateFieldStatuses() {
  const farmlandsData = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  const currentWeek = parseInt(localStorage.getItem('week'), 10);
  const currentSeason = localStorage.getItem('season');

  const farmlands = farmlandsData.map(data => new Farmland(
    data.id,
    data.name,
    data.country,
    data.region,
    data.acres,
    data.plantedResourceName,
    data.vineAge,
    data.grape,
    data.soil,
    data.altitude,
    data.aspect,
    data.density
  ));

  farmlands.forEach(field => {
    if (currentSeason === 'Spring' && currentWeek === 1) {
      updateNewYear(field);
    }
    // Existing status updates
  });

  // Store updates back to localStorage
  const updatedData = farmlands.map(f => ({
    id: f.id,
    name: f.name,
    country: f.country,
    region: f.region,
    acres: f.acres,
    plantedResourceName: f.plantedResourceName,
    vineAge: f.vineAge,
    grape: f.grape,
    soil: f.soil,
    altitude: f.altitude,
    aspect: f.aspect,
    density: f.density
  }));

  localStorage.setItem('ownedFarmlands', JSON.stringify(updatedData));
}

function updateRipeness() {
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const currentWeek = parseInt(localStorage.getItem('week'), 10);
    const currentSeason = localStorage.getItem('season');

    farmlands.forEach(field => {
        if (!field.plantedResourceName) return;

        switch (currentSeason) {
            case 'Spring':
                field.ripeness += 0.01; // Add +1 each week of spring
                break;
            case 'Summer':
                field.ripeness += 0.02; // Add +2 each week of summer
                break;
            case 'Fall':
                field.ripeness += 0.05; // Add +3 each week of fall
                break;
            case 'Winter':
                if (currentWeek === 1) {
                    field.ripeness = 0; // Reset ripeness on first week of winter
                }
                break;
            default:
                break;
        }
    });

    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
}

export function sellWines(resourceName) {
    const resourceIndex = inventoryInstance.items.findIndex(item => item.resource.name === resourceName && item.state === 'Bottle');

    if (resourceIndex !== -1) {
        const resource = inventoryInstance.items[resourceIndex];

        if (resource.amount > 0) {
            resource.amount -= 1; // Reduce the inventory by 1

            // Log the sale transaction and update the balance
            addTransaction('Income', 'Wine Sale', 100);

            if (resource.amount === 0) {
                // Optionally remove the item if the amount reaches zero
                inventoryInstance.items.splice(resourceIndex, 1);
            }

            saveInventory(); // Save the inventory updates

            // Optionally, refresh the inventory display if your UI supports it
            displayInventory(inventoryInstance, ['winecellar-table-body'], true);
        }
    }
}