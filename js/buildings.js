import { loadBuildings } from '/js/database/adminFunctions.js';
import { addConsoleMessage } from '/js/console.js';
import { storeBuildings } from '/js/database/adminFunctions.js';
import { addTransaction} from '/js/finance.js';
import { formatNumber } from '/js/utils.js';
import taskManager from '/js/taskManager.js';
import { updateBuildingCards, updateBuildButtonStates } from '/js/overlays/mainpages/buildingsoverlay.js';
import { Building } from '/js/classes/buildingClasses.js';
import { calculateTotalWork } from './utils/workCalculator.js';

// New shared work calculation function
function calculateConstructionWork(buildingCost) {
    return calculateTotalWork(buildingCost, {
        tasks: ['CONSTRUCTION']
    });
}

export function performBuildBuilding(target, params) {
    const { buildingName, buildingCost } = params;
    const newBuilding = new Building(buildingName);
    const buildings = loadBuildings();
    buildings.push(newBuilding);
    storeBuildings(buildings);

    addConsoleMessage(`${buildingName} has been built successfully. <span style="color: red">Cost: €${formatNumber(buildingCost)}</span>. Capacity: ${newBuilding.capacity} (${newBuilding.capacity} spaces available)`);
    updateBuildingCards();
    updateBuildButtonStates();
}

export function buildBuilding(buildingName) {
    const buildings = loadBuildings();
    const existingBuilding = buildings.find(b => b.name === buildingName);

    if (existingBuilding) {
        addConsoleMessage(`${buildingName} already exists and cannot be built again.`);
        return;
    }

    const buildingCost = Building.BUILDINGS[buildingName]?.baseCost || 500000;
    const constructionWork = calculateConstructionWork(buildingCost);

    // Initial state changes
    const buildButton = document.querySelector(`.build-button[data-building-name="${buildingName}"]`);
    const upgradeButton = document.querySelector(`.upgrade-button[data-building-name="${buildingName}"]`);

    if (buildButton && upgradeButton) {
        buildButton.disabled = true;
        buildButton.textContent = "Building...";
    }

    // Add to transaction history
    addTransaction('Expense', `Construction of ${buildingName}`, -buildingCost);

    // Add initial message
    addConsoleMessage(`Construction of ${buildingName} has begun. <span style="color: red">€${formatNumber(buildingCost)}</span> has been deducted from your account. When complete, capacity will be ${new Building(buildingName).calculateCapacity()} spaces.`);

    // Create building task with new work calculation
    taskManager.addCompletionTask(
        'Building & Maintenance',
        'maintenance',
        constructionWork,
        performBuildBuilding,
        null,
        { buildingName, buildingCost }
    );
}

export function performUpgradeBuilding(target, params) {
    const { buildingName, upgradeCost } = params;
    const buildings = loadBuildings();
    const buildingToUpgrade = buildings.find(b => b.name === buildingName);

    if (buildingToUpgrade) {
        const building = new Building(buildingToUpgrade.name, buildingToUpgrade.level, buildingToUpgrade.slots?.flatMap(slot => slot.tools) || []);
        building.upgrade();
        
        const updatedBuildings = buildings.map(b => 
            b.name === buildingName ? building : b
        );
        storeBuildings(updatedBuildings);

        addConsoleMessage(`${buildingName} has been upgraded to level ${building.level}. <span style="color: red">Cost: €${formatNumber(upgradeCost)}</span>. New Capacity: ${building.capacity} (${building.capacity - (building.tools ? building.tools.length : 0)} spaces available)`);
        updateBuildingCards();
        updateBuildButtonStates();
    }
}

export function upgradeBuilding(buildingName) {
    const buildings = loadBuildings();
    const buildingData = buildings.find(b => b.name === buildingName);

    if (!buildingData) {
        addConsoleMessage(`Building ${buildingName} not found.`);
        return;
    }

    const building = new Building(buildingData.name, buildingData.level, buildingData.tools || []);
    const upgradeCost = building.getUpgradeCost();
    const constructionWork = calculateConstructionWork(upgradeCost);

    // Add to transaction history
    addTransaction('Expense', `Upgrade of ${buildingName}`, -upgradeCost);

    // Add initial message
    addConsoleMessage(`Upgrade of ${buildingName} has begun. <span style="color: red">€${formatNumber(upgradeCost)}</span> has been deducted from your account.`);

    // Create upgrade task with new work calculation
    taskManager.addCompletionTask(
        'Building & Maintenance',
        'maintenance',
        constructionWork,
        performUpgradeBuilding,
        null,
        { buildingName, upgradeCost }
    );
}