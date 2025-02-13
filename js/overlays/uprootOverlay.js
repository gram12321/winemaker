import { getFlagIconHTML, formatNumber } from '../utils.js';
import { addConsoleMessage } from '../console.js';
import { updateFarmland } from '../database/adminFunctions.js';
import taskManager from '../taskManager.js';
import { displayFarmland } from '../overlays/mainpages/landoverlay.js';
import { hideOverlay, showStandardOverlay, setupStandardOverlayClose } from './overlayUtils.js';
import { createWorkCalculationTable } from '../components/workCalculationTable.js';

export function showUprootOverlay(farmland, onUprootCallback) {
    const overlayContainer = showStandardOverlay(createUprootOverlayHTML(farmland));
    setupUprootEventListeners(overlayContainer, farmland, onUprootCallback);
}

function createUprootOverlayHTML(farmland) {
    return `
        <div class="overlay-content overlay-container">
            <section class="overlay-section card mb-4">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Uproot Field: ${getFlagIconHTML(farmland.country)} ${farmland.name}</h3>
                    <button class="btn btn-light btn-sm close-btn">Close</button>
                </div>
                <div class="card-body">
                    <div class="alert alert-warning">
                        <strong>Warning:</strong> You are about to uproot ${farmland.plantedResourceName}. 
                        This action cannot be undone and will destroy the current plantation.
                    </div>
                    <hr class="overlay-divider">
                    <div class="health-bar-container">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <label>Farmland Health:</label>
                            <span class="current-health">${formatNumber(farmland.farmlandHealth * 100)}%</span>
                        </div>
                        <div class="health-bar">
                            <div class="health-bar-base" style="width: ${farmland.farmlandHealth * 100}%"></div>
                            <div class="health-bar-current" style="width: ${farmland.farmlandHealth * 100}%"></div>
                            <div class="health-bar-improvement"></div>
                        </div>
                        <div class="text-end mt-1">
                            <span class="health-improvement"></span>
                        </div>
                    </div>
                    <div id="work-calculation-container">
                        ${createWorkCalculationTable({
                            acres: farmland.acres,
                            baseWork: 50,
                            density: farmland.density,
                            tasks: [],
                            totalWork: 0
                        })}
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
    const healthBar = overlayContainer.querySelector('.health-bar');
    const currentHealth = farmland.farmlandHealth;
    const newHealth = 0.5;  // Target health after uprooting
    
    // Calculate total work based on acres and density
    const baseWorkPerAcre = 50;  // Base work units per acre
    const densityFactor = farmland.density / 1000;  // Density factor (e.g., 5000 vines/acre = 5x multiplier)
    const totalWork = Math.ceil(farmland.acres * (baseWorkPerAcre * (densityFactor)));  // Total work units

    // Update all work-related displays
    const totalWorkSpan = overlayContainer.querySelector('#total-work');
    const fieldSizeSpan = overlayContainer.querySelector('#field-size');
    const baseWorkSpan = overlayContainer.querySelector('#base-work');
    const densitySpan = overlayContainer.querySelector('#density');
    const densityFactorSpan = overlayContainer.querySelector('#density-factor');

    if (totalWorkSpan) totalWorkSpan.textContent = formatNumber(totalWork);
    if (fieldSizeSpan) fieldSizeSpan.textContent = formatNumber(farmland.acres);
    if (baseWorkSpan) baseWorkSpan.textContent = formatNumber(baseWorkPerAcre);
    if (densitySpan) densitySpan.textContent = formatNumber(farmland.density);
    if (densityFactorSpan) densityFactorSpan.textContent = formatNumber(densityFactor, 1);

    // Update health bar visualization showing the reduction if current health is higher
    updateHealthBar(healthBar, currentHealth, newHealth);

    uprootButton.addEventListener('click', () => {
        taskManager.addProgressiveTask(
            'Uprooting',
            'field',  // Changed from TaskType.field
            totalWork,
            (target, progress) => {
                const percentComplete = Math.floor(progress * 100);
                addConsoleMessage(`Uprooting ${getFlagIconHTML(target.country)} ${target.name}: ${percentComplete}% complete... (${formatNumber(totalWork)} work units)`, true);

                if (progress >= 1) {
                    updateFarmland(target.id, {
                        plantedResourceName: null,
                        status: 'Ready for planting',
                        canBeCleared: 'Ready to be cleared',
                        density: null,
                        farmlandHealth: 0.5  // Reset health to 50%
                    });
                    addConsoleMessage(`Uprooting of ${getFlagIconHTML(target.country)} ${target.name} is complete. Farmland health reset to 50%`);
                    displayFarmland();
                }
            },
            farmland
        );

        onUprootCallback();
        hideOverlay(overlayContainer);
    });

    setupCloseButton(overlayContainer);
}

function updateHealthBar(healthBar, currentHealth, newHealth) {
    if (healthBar) {
        const currentHealthBar = healthBar.querySelector('.health-bar-current');
        const improvementBar = healthBar.querySelector('.health-bar-improvement');
        const currentHealthSpan = healthBar.parentElement.querySelector('.current-health');
        const improvementSpan = healthBar.parentElement.querySelector('.health-improvement');

        // Calculate the difference (will be negative if health decreases)
        const difference = newHealth - currentHealth;

        // Update the current health display
        if (currentHealthSpan) {
            currentHealthSpan.textContent = `${formatNumber((newHealth +0.5) * 100)}%`; // +0.5 to show 100% at the end of the bar IE 50% health is in the middle of the bar
        }

        // Update the health bars
        if (currentHealthBar) {
            currentHealthBar.style.width = `${currentHealth * 100}%`;
        }
        if (improvementBar) {
            // Show the full range of change
            improvementBar.style.width = `${Math.abs(difference) * 100}%`;
            // Position improvement bar at the end point for decrease
            improvementBar.style.left = difference < 0 ? `${newHealth * 100}%` : `${currentHealth * 100}%`;
            // Red for decrease, green for increase
            improvementBar.style.backgroundColor = difference >= 0 ? '#28a745' : '#dc3545';
        }

        // Update the improvement text
        if (improvementSpan) {
            improvementSpan.textContent = difference !== 0 
                ? `${difference > 0 ? '+' : ''}${formatNumber(difference * 100)}%` 
                : '';
            improvementSpan.style.color = difference >= 0 ? '#28a745' : '#dc3545';
            // Add additional warning text for health reduction
            if (difference < 0) {
                improvementSpan.textContent += ' (Reset to 50%)';
            }
        }
    }
}

function setupCloseButton(overlayContainer) {
    setupStandardOverlayClose(overlayContainer);
}
