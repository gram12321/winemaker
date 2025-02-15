import { getFlagIconHTML, formatNumber } from '../utils.js';
import { addConsoleMessage } from '../console.js';
import { updateFarmland } from '../database/adminFunctions.js';
import taskManager from '../taskManager.js';
import { displayFarmland } from '../overlays/mainpages/landoverlay.js';
import { hideOverlay, showStandardOverlay, setupStandardOverlayClose } from './overlayUtils.js';
import { createWorkCalculationTable } from '../components/workCalculationTable.js';
import { calculateTotalWork } from '../utils/workCalculator.js';  // Update import to get the function instead of the class
import { createHealthBar, updateHealthBar } from '../components/healthBar.js';
import { DEFAULT_FARMLAND_HEALTH } from '../constants/constants.js';  // Update import, remove VINE_WORK_PER_WEEK
import { createOverlayHTML } from '../components/createOverlayHTML.js';

export function showUprootOverlay(farmland, onUprootCallback) {
    const overlayContainer = showStandardOverlay(createUprootOverlayHTML(farmland));
    setupUprootEventListeners(overlayContainer, farmland, onUprootCallback);
}

function calculateUprootWorkData(farmland) { // uses utility workCalculator to calculate total work
    const totalWork = calculateTotalWork(farmland.acres, {
        density: farmland.density,
        tasks: ['UPROOTING']  // Use uppercase to match WORK_RATES keys
    });

    return {
        acres: farmland.acres,
        density: farmland.density,
        tasks: ['UPROOTING'],  // Use uppercase to match WORK_RATES keys
        totalWork
    };
}

function createUprootOverlayHTML(farmland) {
    const workData = calculateUprootWorkData(farmland);
    const healthData = {
        currentHealth: farmland.farmlandHealth,
        newHealth: farmland.farmlandHealth
    };

    const content = `
        ${createHealthBar(healthData)}
        ${createWorkCalculationTable(workData)}
    `;

    return createOverlayHTML({
        title: 'Uproot Field:',
        farmland,
        content,
        buttonText: 'Uproot Field',
        buttonClass: 'btn-warning',
        buttonIdentifier: 'uproot-btn',
        warningMessage: `You are about to uproot ${farmland.plantedResourceName}. 
                        <br>
                        This action cannot be undone and will destroy the current plantation.`
    });
}

function setupUprootEventListeners(overlayContainer, farmland, onUprootCallback) {
    const uprootButton = overlayContainer.querySelector('.uproot-btn');
    const healthBar = overlayContainer.querySelector('.health-bar-container');  // Updated selector
    const currentHealth = farmland.farmlandHealth;
    const newHealth = DEFAULT_FARMLAND_HEALTH;  // Target health after uprooting
    
    // Calculate total work using the calculator
    const totalWork = calculateTotalWork(farmland.acres, {
        density: farmland.density,
        tasks: ['UPROOTING']  // Use uppercase to match WORK_RATES keys
    });

    // Update health bar visualization showing the reduction if current health is higher
    updateHealthBar(healthBar, currentHealth, newHealth);

    uprootButton.addEventListener('click', () => {
        if (uproot(farmland, totalWork)) {
            onUprootCallback();
            hideOverlay(overlayContainer);
        }
    });

    setupStandardOverlayClose(overlayContainer);  // Use directly instead of through wrapper
}

function uproot(farmland, totalWork) {
    const task = taskManager.addProgressiveTask(
        'Uprooting',
        'field',
        totalWork,
        (target, progress) => {
            const percentComplete = Math.floor(progress * 100);
            addConsoleMessage(
                `Uprooting ${getFlagIconHTML(target.country)} ${target.name}: ${percentComplete}% complete... (${formatNumber(totalWork)} work units)`, 
                true
            );

            if (progress >= 1) {
                updateFarmland(target.id, {
                    plantedResourceName: null,
                    status: 'Ready for planting',
                    canBeCleared: 'Ready to be cleared',
                    density: null,
                    farmlandHealth: DEFAULT_FARMLAND_HEALTH  // Reset health to default
                });
                addConsoleMessage(`Uprooting of ${getFlagIconHTML(target.country)} ${target.name} is complete. Farmland health reset to ${DEFAULT_FARMLAND_HEALTH * 100}%`);
                displayFarmland();
            }
        },
        farmland
    );

    return task !== null;
}
