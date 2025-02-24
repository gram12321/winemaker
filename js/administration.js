import { addConsoleMessage } from '/js/console.js';
import { extractSeasonAndYear, formatNumber } from './utils.js';
import taskManager from './taskManager.js';
import { getGameState, getTransactions } from './database/adminFunctions.js';
import { calculateRealPrestige } from './company.js'; // Add this import
import { loadBuildings, storeBuildings } from './database/adminFunctions.js'; // Add this import

function calculateBookkeepingWork(prevSeason, prevYear) {
    const transactions = getTransactions();
    const prevSeasonTransactions = transactions.filter(transaction => {
        const { season, year } = extractSeasonAndYear(transaction.date);
        return season === prevSeason && year === prevYear;
    });

    // Calculate base work from transactions
    return prevSeasonTransactions.length * 10;
}

function validateBookkeeping() {
    const existingTasks = taskManager.getAllTasks().filter(task => 
        task.name.startsWith('Bookkeeping') && task.type === 'completion'
    );

    // Calculate spillover work with 10% penalty
    const spilloverWork = existingTasks.reduce((total, task) => {
        const remainingWork = task.totalWork - task.appliedWork;
        return total + (remainingWork * 1.1);
    }, 0);

    // Apply prestige penalty if there were incomplete tasks
    if (existingTasks.length > 0) {
        const currentPrestige = calculateRealPrestige();
        const prestigeHit = -(currentPrestige * 0.1);
        localStorage.setItem('prestigeHit', 
            (parseFloat(localStorage.getItem('prestigeHit') || 0) + prestigeHit).toString()
        );
        
        const penaltyAmount = existingTasks.reduce((total, task) => {
            const remainingWork = task.totalWork - task.appliedWork;
            return total + (remainingWork * 0.1);
        }, 0);

        addConsoleMessage(
            `Incomplete bookkeeping tasks have affected company prestige! Lost ${Math.abs(prestigeHit).toFixed(2)} prestige points (10% of current prestige). ${formatNumber(penaltyAmount, 1)} extra work units added as penalty to the new task.`,
            false, true
        );
    }

    // Remove existing tasks
    existingTasks.forEach(task => taskManager.removeTask(task.id));

    return spilloverWork;
}

export function bookkeeping() {
    const { week, season: currentSeason, year: currentYear } = getGameState();
    const seasons = ['Winter', 'Spring', 'Summer', 'Fall'];

    // Only trigger on first week of new season
    if (week !== 1) return;

    // Get previous season and year
    const prevSeasonIndex = (seasons.indexOf(currentSeason) - 1 + 4) % 4;
    const prevSeason = seasons[prevSeasonIndex];
    const prevYear = prevSeasonIndex === 3 ? currentYear - 1 : currentYear;

    const baseWork = calculateBookkeepingWork(prevSeason, prevYear);
    const spilloverWork = validateBookkeeping();
    const totalWork = baseWork + spilloverWork;

    taskManager.addCompletionTask(
        'Bookkeeping',
        'administration',
        totalWork,
        performBookkeeping,
        null,
        { prevSeason, prevYear }
    );
}

export function performBookkeeping(target, params) {
    const { prevSeason, prevYear } = params;
    addConsoleMessage(`Bookkeeping for ${prevSeason} ${prevYear} completed successfully!`);
}

function validateMaintenance() {
    const existingTasks = taskManager.getAllTasks().filter(task => 
        task.name.startsWith('Maintain') && task.type === 'completion'
    );

    // Calculate spillover work with 10% penalty for each building
    const spilloverByBuilding = {};
    const currentPrestige = calculateRealPrestige();
    
    // Handle existing incomplete tasks
    existingTasks.forEach(task => {
        const buildingName = task.target.name;
        const remainingWork = task.totalWork - task.appliedWork;
        spilloverByBuilding[buildingName] = (spilloverByBuilding[buildingName] || 0) + (remainingWork * 1.1);

        // Each unmaintained building causes a 10% prestige hit
        const prestigeHit = -(currentPrestige * 0.1);
        localStorage.setItem('prestigeHit', 
            (parseFloat(localStorage.getItem('prestigeHit') || 0) + prestigeHit).toString()
        );
        
        addConsoleMessage(
            `Incomplete maintenance of ${buildingName} has affected company prestige! Lost ${Math.abs(prestigeHit).toFixed(2)} prestige points (10% of current prestige). Next year's task will include ${formatNumber(remainingWork * 1.1, 1)} additional work units as penalty.`,
            false, true
        );
        taskManager.removeTask(task.id);
    });

    return spilloverByBuilding;
}

export function maintenance() {
    const { week, season, year } = getGameState();
    
    // Only trigger on first week of Spring
    if (week !== 1 || season !== 'Spring') return;

    const buildings = loadBuildings();
    const spilloverByBuilding = validateMaintenance();

    // Create new maintenance tasks for each building
    buildings.forEach(building => {
        const baseWork = 100;
        const levelMultiplier = Math.pow(1.2, building.level);
        const spilloverWork = spilloverByBuilding[building.name] || 0;
        const totalWork = Math.round((baseWork * levelMultiplier) + spilloverWork);

        taskManager.addCompletionTask(
            'Maintain',
            'maintenance',
            totalWork,
            performMaintenance,
            building,
            { year }  // Removed maintenanceCost from params
        );
    });
}

export function performMaintenance(target) {
    addConsoleMessage(`Maintenance of ${target.name} completed successfully.`);
}
