// endDay.js
import { addConsoleMessage } from './console.js';
import { renderCompanyInfo } from './database/loadSidebar.js';
import { inventoryInstance, displayInventory } from './resource.js'; // Import needed functions
import { saveInventory } from './database/adminFunctions.js';
import { executeAllTasks } from './loadPanel.js'
import { processRecurringTransactions, addTransaction } from './finance.js';
import { handleBookkeepingTask } from './administration.js';
import { Farmland } from './farmland.js';  // Ensure Farmland is imported if used elsewhere
import { applyPrestigeHit, decayPrestigeHit } from './database/loadSidebar.js';

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
    decayPrestigeHit()
    // Process recurring transactions based on updated week
    processRecurringTransactions(currentWeek);
}

// Define the new function to increment the vine age
export function updateNewYear(farmlands) {
    farmlands.forEach(field => {
        if (field.plantedResourceName) { // Check that there is something plantet on the field
            field.vineAge += 1; // Increment the vine age
        }
    });
}

// Updated updateFieldStatuses function
export function updateFieldStatuses() {
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const currentWeek = parseInt(localStorage.getItem('week'), 10);
    const currentSeason = localStorage.getItem('season');

    farmlands.forEach(field => {
        switch (currentSeason) {
            case 'Winter':
                if (currentWeek === 1) {
                    field.status = 'Dormancy';
                }
                break;
            case 'Spring':
                if (currentWeek === 1) {
                    // Set field to Growing if it's the second season for a crop
                    if (field.status === "No yield in first season") {
                        field.status = 'Growing';
                    }

                    // Increment vine age for every field on the first week of spring
                    updateNewYear(farmlands);
                }
                break;
            case 'Summer':
                if (currentWeek === 1) {
                    field.status = 'Ripening';
                }
                break;
            case 'Fall':
                if (currentWeek === 1) {
                    field.status = 'Ready for Harvest';
                }
                break;
            default:
                break;
        }
    });

    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
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

            const sellingPrice = calculateWinePrice(resource.quality); // Use the new function

            // Log the sale transaction and update the balance
            addTransaction('Income', 'Wine Sale', sellingPrice);

            // Optionally handle prestige effects if used
            const prestigeHit = sellingPrice / 1000;
            applyPrestigeHit(prestigeHit);

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


// New function to calculate wine price
export function calculateWinePrice(quality) {
    const baseValue = 10; // Base value in Euros
    return baseValue * quality;
}