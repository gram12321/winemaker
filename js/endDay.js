// endDay.js
import { addConsoleMessage } from './console.js';
import { renderCompanyInfo } from './database/loadSidebar.js';
import { processRecurringTransactions } from './finance.js';
import { calculateLandvalue, calculateFarmlandPrestige, displayFarmland } from './farmland.js';
import { generateWineOrder, shouldGenerateWineOrder } from './sales.js';
import { 
    getGameState, 
    updateGameState, 
    getFarmlands, 
    updateAllFarmlands, 
    updateFarmland,
    getPrestigeHit,
    setPrestigeHit,
    calculateRealPrestige
} from './database/adminFunctions.js';

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

export function incrementWeek() {
    const gameState = getGameState();
    let { week, season, year } = gameState;
    let currentSeasonIndex = SEASONS.indexOf(season);

    // Increment the week
    week += 1;

    // Check if the week exceeds 12, which indicates a change of season
    if (week > 12) {
        week = 1;
        currentSeasonIndex = (currentSeasonIndex + 1) % SEASONS.length;
        season = SEASONS[currentSeasonIndex];
    }

    // Only increment the year if we are back to the first week of Spring
    if (currentSeasonIndex === 0 && week === 1) {
        year += 1;
    }

    // Update game state
    updateGameState(week, season, year);
    
    // Log the change to console and update UI elements
    addConsoleMessage(`New week: <strong>Week ${week}, ${season}, ${year}</strong>`);
    renderCompanyInfo();

    // Execute pending tasks
    updateFieldStatuses();
    updateRipeness();
    
    // Decay prestige hit by 10%
    setPrestigeHit(getPrestigeHit() * 0.9);
    calculateRealPrestige(); // Update calculated prestige after decay

    if (shouldGenerateWineOrder()) {
        generateWineOrder();
    }

    processRecurringTransactions(week);
}

export function updateNewYear(farmlands) {
    farmlands.forEach(field => {
        if (field.plantedResourceName) {
            field.vineAge += 1;
        }
        field.landvalue = calculateLandvalue(field.country, field.region, field.altitude, field.aspect);
        field.farmlandPrestige = calculateFarmlandPrestige(field);
        field.annualYieldFactor = (0.5 + Math.random()) * 1.5;
        field.annualQualityFactor = Math.random();
    });
    updateAllFarmlands(farmlands);
}

export function updateFieldStatuses() {
    const farmlands = getFarmlands();
    const { week, season } = getGameState();

    farmlands.forEach((field, index) => {
        let updates = null;

        switch (season) {
            case 'Winter':
                if (week === 1) {
                    updates = { status: 'Dormancy' };
                }
                break;
            case 'Spring':
                if (week === 1) {
                    if (field.status === "No yield in first season") {
                        updates = { status: 'Growing' };
                    } else if (field.status === 'Dormancy' && field.plantedResourceName) {
                        updates = { status: 'Growing' };
                    }
                }
                break;
            case 'Summer':
                if (week === 1 && field.status !== 'Harvested' && field.status !== 'Dormancy') {
                    updates = { status: 'Ripening' };
                }
                break;
            case 'Fall':
                if (week === 1 && field.status !== 'Harvested' && field.status !== 'Dormancy') {
                    updates = { status: 'Ready for Harvest' };
                }
                break;
        }

        if (updates) {
            updateFarmland(field.id, updates);
        }
    });

    if (season === 'Spring' && week === 1) {
        updateNewYear(farmlands);
    }

    displayFarmland();
}

function updateRipeness() {
    const farmlands = getFarmlands();
    const { week, season } = getGameState();

    farmlands.forEach((field, index) => {
        if (!field.plantedResourceName || field.status === 'Harvested') return;

        let ripenessUpdate = 0;
        switch (season) {
            case 'Spring': ripenessUpdate = 0.01; break;
            case 'Summer': ripenessUpdate = 0.02; break;
            case 'Fall': ripenessUpdate = 0.05; break;
            case 'Winter':
                if (week === 1) {
                    updateFarmland(field.id, { ripeness: 0 });
                    return;
                }
        }

        if (ripenessUpdate > 0) {
            updateFarmland(field.id, { ripeness: field.ripeness + ripenessUpdate });
        }
    });

    displayFarmland();
}


