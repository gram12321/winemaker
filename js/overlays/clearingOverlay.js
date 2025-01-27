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
                    <div class="form-group">
                        <div class="clearing-options">
                            <div class="form-check mb-2">
                                <input type="checkbox" class="form-check-input" id="remove-vines" ${!farmland.plantedResourceName ? 'disabled' : ''}>
                                <label class="form-check-label ${!farmland.plantedResourceName ? 'text-muted' : ''}" for="remove-vines">
                                    Removal of old Vines ${!farmland.plantedResourceName ? '(No vines planted)' : ''}
                                </label>
                            </div>
                            <div class="form-check mb-2">
                                <input type="checkbox" class="form-check-input" id="clear-vegetation">
                                <label class="form-check-label" for="clear-vegetation">Clear Vegetation</label>
                            </div>
                            <div class="form-check mb-2">
                                <input type="checkbox" class="form-check-input" id="remove-debris">
                                <label class="form-check-label" for="remove-debris">Debris Removal</label>
                            </div>
                        </div>
                    </div>
                    <div class="work-details mt-3">
                        <div>Selected Tasks: <span id="selected-tasks">0</span>/3</div>
                        <div>Estimated Work: <span id="total-work">0</span> units</div>
                        <div>Health Improvement: +<span id="health-improvement">0</span></div>
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
    const selectedTasksSpan = overlayContainer.querySelector('#selected-tasks');
    const totalWorkSpan = overlayContainer.querySelector('#total-work');
    const healthImprovementSpan = overlayContainer.querySelector('#health-improvement');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => updateWorkCalculations(checkboxes, selectedTasksSpan, totalWorkSpan, healthImprovementSpan));
    });

    setupClearButton(overlayContainer, farmland, checkboxes, onClearCallback);
    setupCloseButton(overlayContainer);
}

function updateWorkCalculations(checkboxes, selectedTasksSpan, totalWorkSpan, healthImprovementSpan) {
    const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const totalWork = selectedCount * 100; // 100 work units per task
    const healthImprovement = (selectedCount * 0.5 / 3).toFixed(2); // Dividing total possible improvement (0.5) by number of tasks

    selectedTasksSpan.textContent = selectedCount;
    totalWorkSpan.textContent = totalWork;
    healthImprovementSpan.textContent = healthImprovement;
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
