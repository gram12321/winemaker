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
                                ${!farmland.plantedResourceName ? 'disabled' : ''}>
                            <label class="form-check-label ${!farmland.plantedResourceName ? 'text-muted' : ''}" for="remove-vines">
                                Vine Replanting ${!farmland.plantedResourceName ? '(No vines planted)' : ''}
                            </label>
                            <div class="slider-container mt-2 ${!farmland.plantedResourceName ? 'd-none' : ''}">
                                <div class="d-flex align-items-center">
                                    <span class="mr-2">Low</span>
                                    <input type="range" class="custom-range" id="replanting-slider" 
                                        min="0" max="100" step="1" value="100" 
                                        ${!farmland.plantedResourceName ? 'disabled' : ''}>
                                    <span class="ml-2">High</span>
                                </div>
                                <div class="text-center">
                                    Replanting intensity: <span id="replanting-value">100</span>%
                                </div>
                            </div>
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
    const replantingSlider = overlayContainer.querySelector('#replanting-slider');
    const replantingValue = overlayContainer.querySelector('#replanting-value');
    const removeVinesCheckbox = overlayContainer.querySelector('#remove-vines');

    // Handle slider updates
    replantingSlider.addEventListener('input', () => {
        replantingValue.textContent = replantingSlider.value;
        updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth, replantingSlider);
    });

    // Show/hide slider when vine replanting is checked/unchecked
    removeVinesCheckbox.addEventListener('change', (e) => {
        const sliderContainer = overlayContainer.querySelector('.slider-container');
        sliderContainer.style.display = e.target.checked ? 'block' : 'none';
        updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth, replantingSlider);
    });

    checkboxes.forEach(checkbox => {
        if (checkbox.id !== 'remove-vines') {
            checkbox.addEventListener('change', () => 
                updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth, replantingSlider));
        }
    });

    setupClearButton(overlayContainer, farmland, checkboxes, replantingSlider, onClearCallback);
    setupCloseButton(overlayContainer);
}

function updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth, replantingSlider) {
    const selectedTasks = Array.from(checkboxes).filter(cb => cb.checked);
    const totalWork = selectedTasks.length * 100;

    // Calculate health improvement
    const healthImprovementPerTask = 0.17; // 17% per task
    let totalHealthImprovement = 0;

    selectedTasks.forEach(task => {
        if (task.id === 'remove-vines') {
            // Apply slider percentage to vine replanting health improvement
            const sliderPercentage = parseInt(replantingSlider.value) / 100;
            totalHealthImprovement += healthImprovementPerTask * sliderPercentage;
        } else {
            totalHealthImprovement += healthImprovementPerTask;
        }
    });

    const newHealth = Math.min(1.0, currentHealth + totalHealthImprovement);

    // Update displays
    if (totalWorkSpan) totalWorkSpan.textContent = totalWork;
    updateHealthBarDisplay(healthBar, currentHealth, newHealth);
}

function updateHealthBarDisplay(healthBar, currentHealth, newHealth) {
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

function setupClearButton(overlayContainer, farmland, checkboxes, replantingSlider, onClearCallback) {
    const clearButton = overlayContainer.querySelector('.clear-btn');
    clearButton.addEventListener('click', () => {
        const selectedTasks = Array.from(checkboxes).filter(cb => cb.checked);
        if (selectedTasks.length === 0) {
            addConsoleMessage('Please select at least one clearing task', false, true);
            return;
        }

        const totalWork = selectedTasks.length * 100;
        const healthImprovementPerTask = 0.5 / 3;
        let totalHealthImprovement = 0;

        selectedTasks.forEach(task => {
            if (task.id === 'remove-vines') {
                const sliderPercentage = parseInt(replantingSlider.value) / 100;
                totalHealthImprovement += healthImprovementPerTask * sliderPercentage;
            } else {
                totalHealthImprovement += healthImprovementPerTask;
            }
        });

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
