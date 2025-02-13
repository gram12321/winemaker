import { getFlagIconHTML, formatNumber } from '../utils.js';
import { addConsoleMessage } from '../console.js';
import { updateFarmland } from '../database/adminFunctions.js';
import taskManager from '../taskManager.js';
import { displayFarmland } from '../overlays/mainpages/landoverlay.js';
import { hideOverlay, showStandardOverlay, setupStandardOverlayClose } from './overlayUtils.js';
import { createWorkCalculationTable } from '../components/workCalculationTable.js';
import { workCalculator } from '../utils/workCalculator.js';
import { createHealthBar, updateHealthBar } from '../components/healthBar.js';
import { DEFAULT_FARMLAND_HEALTH } from '../constants/constants.js';

export function showUprootOverlay(farmland, onUprootCallback) {
    const overlayContainer = showStandardOverlay(createUprootOverlayHTML(farmland));
    setupUprootEventListeners(overlayContainer, farmland, onUprootCallback);
}

function calculateUprootWorkData(farmland) { // uses utility workCalculator to calculate total work
    const totalWork = workCalculator.calculateTotalWork(farmland.acres, {
        density: farmland.density
    });

    return {
        acres: farmland.acres,
        density: farmland.density,
        tasks: ['Uprooting'],
        totalWork
    };
}

function createUprootOverlayHTML(farmland) {
    const workData = calculateUprootWorkData(farmland);
    const healthData = {
        currentHealth: farmland.farmlandHealth,
        newHealth: farmland.farmlandHealth
    };
    
    return `
        <div class="overlay-content overlay-container">
            <section class="overlay-section card mb-4">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Uproot Field: ${getFlagIconHTML(farmland.country)} ${farmland.name}</h3>
                    <button class="btn btn-light btn-sm close-btn">Close</button>
                </div>
                <div class="card-body">
                    <div class="alert alert-warning">
                        <strong>Warning:</strong> 
                        <br>
                        You are about to uproot ${farmland.plantedResourceName}. 
                        <br>
                        This action cannot be undone and will destroy the current plantation.
                    </div>
                    <hr class="overlay-divider">
                    ${createHealthBar(healthData)}
                    <div id="work-calculation-container">
                        ${createWorkCalculationTable(workData)}
                    </div>
                    <div class="d-flex justify-content-center mt-4">
                        <button class="btn btn-danger uproot-btn">Uproot Field</button>
                    </div>
                </div>
            </section>
        </div>
    `;
}

function setupUprootEventListeners(overlayContainer, farmland, onUprootCallback) {
    const uprootButton = overlayContainer.querySelector('.uproot-btn');
    const healthBar = overlayContainer.querySelector('.health-bar-container');  // Updated selector
    const currentHealth = farmland.farmlandHealth;
    const newHealth = DEFAULT_FARMLAND_HEALTH;  // Target health after uprooting
    
    // Calculate total work using the calculator
    const totalWork = workCalculator.calculateTotalWork(farmland.acres, {
        density: farmland.density
    });

    // Update health bar visualization showing the reduction if current health is higher
    updateHealthBar(healthBar, currentHealth, newHealth);

    uprootButton.addEventListener('click', () => {
        if (uproot(farmland, totalWork)) {
            onUprootCallback();
            hideOverlay(overlayContainer);
        }
    });

    setupCloseButton(overlayContainer);
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

function setupCloseButton(overlayContainer) {
    setupStandardOverlayClose(overlayContainer);
}
