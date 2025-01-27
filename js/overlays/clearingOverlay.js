import { getFlagIconHTML, formatNumber } from '../utils.js';
import { addConsoleMessage } from '../console.js';
import { updateFarmland } from '../database/adminFunctions.js';
import taskManager, { TaskType } from '../taskManager.js';
import { displayFarmland } from '../overlays/mainpages/landoverlay.js';
import { hideOverlay, showStandardOverlay, setupStandardOverlayClose } from './overlayUtils.js';

export function showClearingOverlay(farmland, onClearCallback) {
    const overlayContainer = showStandardOverlay(createClearingOverlayHTML(farmland));
    setupClearingEventListeners(overlayContainer, farmland, onClearCallback);
}

function createClearingOverlayHTML(farmland) {
    return `
        <div class="overlay-content overlay-container">
            <section class="overlay-section card mb-4">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Clearing Options for ${getFlagIconHTML(farmland.country)} ${farmland.name}</h3>
                    <button class="btn btn-light btn-sm close-btn">Close</button>
                </div>
                <div class="card-body">
                    <div class="clearing-options">
                        <div class="form-check mb-3">
                            <input type="checkbox" class="form-check-input" id="remove-vines" 
                                ${!farmland.plantedResourceName ? 'disabled' : 'checked onclick="return false;"'}>
                            <label class="form-check-label ${!farmland.plantedResourceName ? 'text-muted' : ''}" for="remove-vines">
                                Removal of old Vines ${!farmland.plantedResourceName ? '(No vines planted)' : '(Required)'}
                            </label>
                        </div>
                        <div class="form-check mb-3">
                            <input type="checkbox" class="form-check-input" id="clear-vegetation">
                            <label class="form-check-label" for="clear-vegetation">Clear Vegetation</label>
                        </div>
                        <div class="form-check mb-3">
                            <input type="checkbox" class="form-check-input" id="remove-debris">
                            <label class="form-check-label" for="remove-debris">Debris Removal</label>
                        </div>
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
                    <div class="work-details text-center mt-4">
                        <div class="mb-3">Estimated Work: <span id="total-work">0</span> units</div>
                    </div>
                    <div class="d-flex justify-content-center mt-4">
                        <button class="btn btn-warning clear-btn">Clear Field</button>
                    </div>
                </div>
            </section>
        </div>
    `;
}

function setupClearingEventListeners(overlayContainer, farmland, onClearCallback) {
    const checkboxes = overlayContainer.querySelectorAll('input[type="checkbox"]');
    const totalWorkSpan = overlayContainer.querySelector('#total-work');
    const healthBar = overlayContainer.querySelector('.health-bar');
    const currentHealth = farmland.farmlandHealth;

    // Always run initial calculation to account for default checked vine removal
    updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth);
    
    // Only add change listeners to non-vine-removal checkboxes
    checkboxes.forEach(checkbox => {
        if (checkbox.id !== 'remove-vines') {
            checkbox.addEventListener('change', () => updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth));
        }
    });

    setupClearButton(overlayContainer, farmland, checkboxes, onClearCallback);
    setupCloseButton(overlayContainer);
}

function updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth) {
    const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const totalWork = selectedCount * 100;

    // Calculate health improvement per task
    const healthImprovementPerTask = 0.17; // 17% per task
    const totalHealthImprovement = selectedCount * healthImprovementPerTask;
    const newHealth = Math.min(1.0, currentHealth + totalHealthImprovement);

    if (totalWorkSpan) totalWorkSpan.textContent = totalWork;

    // Update health bar visualization
    if (healthBar) {
        const currentHealthBar = healthBar.querySelector('.health-bar-current');
        const improvementBar = healthBar.querySelector('.health-bar-improvement');
        const currentHealthSpan = healthBar.parentElement.querySelector('.current-health');
        const improvementSpan = healthBar.querySelector('.health-improvement');

        // Update the current health display
        if (currentHealthSpan) {
            currentHealthSpan.textContent = `${formatNumber(newHealth * 100)}%`;
        }

        // Update the health bars
        if (currentHealthBar) {
            currentHealthBar.style.width = `${currentHealth * 100}%`;
        }
        if (improvementBar) {
            improvementBar.style.width = `${(newHealth - currentHealth) * 100}%`;
            improvementBar.style.left = `${currentHealth * 100}%`;
        }

        // Update the improvement text
        if (improvementSpan) {
            improvementSpan.textContent = totalHealthImprovement > 0 
                ? `+${formatNumber(totalHealthImprovement * 100)}%` 
                : '';
        }
    }
}

function setupClearButton(overlayContainer, farmland, checkboxes, onClearCallback) {
    const clearButton = overlayContainer.querySelector('.clear-btn');
    clearButton.addEventListener('click', () => {
        const selectedTasks = Array.from(checkboxes).filter(cb => cb.checked);
        if (selectedTasks.length === 0) {
            addConsoleMessage('Please select at least one clearing task', false, true);
            return;
        }

        const totalWork = selectedTasks.length * 100;
        const healthImprovementPerTask = 0.5 / 3; // Total improvement (0.5) divided by total possible tasks (3)
        const totalHealthImprovement = selectedTasks.length * healthImprovementPerTask;

        taskManager.addProgressiveTask(
            'Clearing',
            TaskType.field,
            totalWork,
            (target, progress, params) => {
                // This callback runs on progress updates
                const percentComplete = Math.floor(progress * 100);
                addConsoleMessage(`Clearing ${getFlagIconHTML(target.country)} ${target.name}: ${percentComplete}% complete...`, true);

                if (progress >= 1) {
                    // Calculate new health value, capped at 1.0
                    const newHealth = Math.min(1.0, target.farmlandHealth + totalHealthImprovement);
                    const actualImprovement = newHealth - target.farmlandHealth;
                    
                    // Update farmland
                    updateFarmland(target.id, {
                        plantedResourceName: null,
                        status: 'Ready for planting',
                        canBeCleared: 'Not ready',
                        farmlandHealth: newHealth
                    });

                    // Final message
                    addConsoleMessage(`Clearing of ${getFlagIconHTML(target.country)} ${target.name} is done. Farmland health was improved by ${formatNumber(actualImprovement * 100)}%`);
                    displayFarmland();
                }
            },
            farmland,
            { selectedTasks: selectedTasks.map(cb => cb.id) }
        );

        onClearCallback();
        hideOverlay(overlayContainer);
    });
}

function setupCloseButton(overlayContainer) {
    setupStandardOverlayClose(overlayContainer);
}
