// endDay.js
import { addConsoleMessage } from './console.js';
import { updateAllDisplays } from './displayManager.js';
import { processRecurringTransactions } from './finance.js';
import { calculateLandvalue, calculateFarmlandPrestige } from './farmland.js';
import { displayFarmland } from './overlays/mainpages/landoverlay.js';
import { generateWineOrder, shouldGenerateWineOrder } from './sales.js';
import { getGameState, updateGameState, getFarmlands, updateAllFarmlands, updateFarmland, getPrestigeHit, setPrestigeHit, calculateRealPrestige, loadTasks, saveTasks } from './database/adminFunctions.js';
import taskManager from './taskManager.js';
import { finalizePlanting } from './overlays/plantingOverlay.js';
import { formatNumber, getFlagIconHTML, getColorClass } from './utils.js';
import { bookkeeping } from './administration.js';

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

export function incrementWeek() {
    const gameState = getGameState();
    let { week, season, year } = gameState;
    let currentSeasonIndex = SEASONS.indexOf(season);

    // Increment the week
    week += 1;

    // Process all running tasks
    taskManager.processWeek();

    // Check if the week exceeds 12, which indicates a change of season
    if (week > 12) {
        week = 1;
        currentSeasonIndex = (currentSeasonIndex + 1) % SEASONS.length;
        season = SEASONS[currentSeasonIndex];
        bookkeeping();
    }

    // Only increment the year if we are back to the first week of Spring
    if (currentSeasonIndex === 0 && week === 1) {
        year += 1;
    }

    // Update game state
    updateGameState(week, season, year);
    
    // Log the change to console and update UI elements
    addConsoleMessage(`New week: <strong>Week ${week}, ${season}, ${year}</strong>`);
    
    // Execute pending tasks
    updateFieldStatuses();
    updateRipeness();
    
    // Update all displays
    updateAllDisplays();
    applyPlantingPenalties(season, week);
    
    // Decay prestige hit by 10% - Could eventually be applied per season instead 
    setPrestigeHit(getPrestigeHit() * 0.99);
    calculateRealPrestige(); // Update calculated prestige after decay

    if (shouldGenerateWineOrder()) {
        generateWineOrder();
    }

    processRecurringTransactions(week);

    // Update only when winter starts
    if (season === 'Winter' && week === 1) {
        updateWinter();
    }
}

function updateWinter() {
    const tasks = loadTasks();
    tasks.forEach((task, taskId) => {
        if (task.name.toLowerCase().includes('harvest') || task.name.toLowerCase().includes('planting')) {
            if (task.name.toLowerCase().includes('planting')) {
                handleIncompletePlantingTask(task);
            }
            taskManager.cancelTask(taskId);
            addConsoleMessage(`${task.name} task for ${task.target.name} has been cancelled due to season change to Winter.`);
        }
    });
    saveTasks(tasks);
}

function handleIncompletePlantingTask(task) {
    const { target, progress, params } = task;
    const farmlands = getFarmlands();
    const field = farmlands.find(f => f.id === target.id);

    if (field) {
        const percentComplete = Math.floor(progress * 100);
        const unplantedPercentage = 1 - progress;
        const healthPenalty = unplantedPercentage;

        field.farmlandHealth = Math.max(0, field.farmlandHealth - healthPenalty);
        field.farmlandHealth = parseFloat(field.farmlandHealth.toFixed(6)); // Round to six decimal places

        updateFarmland(field.id, {
            farmlandHealth: field.farmlandHealth,
            status: 'Planted'
        });

        const flagIcon = getFlagIconHTML(field.country);
        const percentCompleteClass = getColorClass(progress);
        const healthPenaltyPercentage = healthPenalty * 100;
        const healthPercentage = field.farmlandHealth * 100;
        const healthClass = getColorClass(field.farmlandHealth);

        addConsoleMessage(`Planting task for ${flagIcon} ${field.name} was incomplete. <span class="${percentCompleteClass}">${percentComplete}%</span> of the field was planted. Field health reduced by <span class="${healthClass}">${formatNumber(healthPenaltyPercentage, 2)}%</span>. The health of ${field.name} is now <span class="${healthClass}">${formatNumber(healthPercentage, 2)}%</span>.`);

        // Call the common function to finalize planting
        finalizePlanting(field, params);
    }
}


function applyPlantingPenalties(season, week) {
    const farmlands = getFarmlands();
    const plantingTasks = taskManager.getAllTasks().filter(task => task.name.toLowerCase().includes('planting'));

    plantingTasks.forEach(task => {
        const field = farmlands.find(f => f.id === task.target.id);
        if (field) {
            let penalty = 0;
            let seasonName = '';
            switch (season) {
                case 'Spring':
                    penalty = 0.002;
                    seasonName = 'Spring';
                    break;
                case 'Summer':
                    penalty = 0.006;
                    seasonName = 'Summer';
                    break;
                case 'Fall':
                    penalty = 0.01;
                    seasonName = 'Fall';
                    break;
            }
            field.farmlandHealth = Math.max(0, field.farmlandHealth - penalty);
            field.farmlandHealth = parseFloat(field.farmlandHealth.toFixed(6)); // Round to six decimal places
            updateFarmland(field.id, { farmlandHealth: field.farmlandHealth });

            // Add console message only on week 1 and not in Winter
            if (week === 1 && season !== 'Winter') {
                addConsoleMessage(`Planting task is still ongoing on ${field.name}. Planting later in the year will result in higher mortality of the vines, reducing the field's health by ${penalty} every week of ${seasonName}.`);
            }
        }
    });
}

export function updateNewYear(farmlands) {
    farmlands.forEach(field => {
        if (field.plantedResourceName) {
            field.vineAge += 1;
            // Remove the status change from here since it's handled in updateFieldStatuses
            // Only update other annual properties
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

    // Handle new year updates first if it's Spring week 1
    if (season === 'Spring' && week === 1) {
        updateNewYear(farmlands);
    }

    farmlands.forEach((field, index) => {
        let updates = null;

        switch (season) {
            case 'Winter':
                if (week === 1) {
                    updates = { 
                        status: field.vineAge === 0 ? 'No yield in first season' : 'Dormancy',
                        ripeness: 0,
                        annualYieldFactor: 0
                    };
                }
                break;
            case 'Spring':
                if (week === 1) {
                    if ((field.status === 'Dormancy' || field.status === 'No yield in first season') && field.plantedResourceName) {
                        updates = { status: 'Growing' };
                    }
                }
                break;
            case 'Summer':
                if (week === 1 && field.status === 'Growing' && field.vineAge > 0) {
                    updates = { status: 'Ripening' };
                }
                break;
            case 'Fall':
                if (week === 1 && field.status === 'Ripening' && field.vineAge > 0) {
                    updates = { status: 'Ready for Harvest' };
                }
                break;
        }

        if (updates) {
            updateFarmland(field.id, updates);
        }
    });

    displayFarmland();
}

function updateRipeness() {
    const farmlands = getFarmlands();
    const { week, season } = getGameState();

    farmlands.forEach((field, index) => {
        if (!field.plantedResourceName || field.status === 'Harvested' || field.vineAge === 0) return;

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


