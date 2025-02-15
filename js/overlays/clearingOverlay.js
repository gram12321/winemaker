import { getFlagIconHTML, formatNumber } from '../utils.js';
import { addConsoleMessage } from '../console.js';
import { updateFarmland } from '../database/adminFunctions.js';
import taskManager from '../taskManager.js';
import { hideOverlay, showStandardOverlay, setupStandardOverlayClose } from './overlayUtils.js';
import { createHealthBar, updateHealthBar } from '../components/healthBar.js';
import { createWorkCalculationTable } from '../components/workCalculationTable.js';
import { calculateTotalWork } from '../utils/workCalculator.js';
import { DEFAULT_FARMLAND_HEALTH, } from '../constants/constants.js';
import { updateAllDisplays } from '../displayManager.js';

export function showClearingOverlay(farmland, onClearCallback) {
    const overlayContainer = showStandardOverlay(createClearingOverlayHTML(farmland));
    setupClearingEventListeners(overlayContainer, farmland, onClearCallback);
}

function calculateClearingWorkData(farmland, selectedTasks, replantingIntensity = 0) {
    const tasks = selectedTasks.map(task => {
        switch(task.id) {
            case 'remove-vines': return 'UPROOTING';
            case 'clear-vegetation': return 'VEGETATION';
            case 'remove-debris': return 'DEBRIS';
            case 'soil-amendment': return 'AMENDMENT';
            default: return task.id;
        }
    });

    let totalWork = calculateTotalWork(farmland.acres, {
        density: farmland.density,
        tasks: tasks,
        taskMultipliers: {
            'UPROOTING': replantingIntensity
        }
    });

    return {
        acres: farmland.acres,
        density: farmland.density,
        tasks: tasks,
        totalWork: Math.ceil(totalWork)
    };
}

function createClearingOverlayHTML(farmland) {
    const healthData = {
        currentHealth: farmland.farmlandHealth,
        newHealth: farmland.farmlandHealth
    };

    const initialWorkData = calculateClearingWorkData(farmland, []);

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
                            <div class="slider-container mt-2 ${!farmland.plantedResourceName ? 'd-none' : ''}" id="replanting-slider-container">
                                <div class="d-flex align-items-center">
                                    <span class="mr-2">Low</span>
                                    <input type="range" class="custom-range" id="replanting-slider" 
                                        min="0" max="100" step="1" value="100" 
                                        ${!farmland.plantedResourceName ? 'disabled' : ''}>
                                    <span class="ml-2">High</span>
                                </div>
                                <div class="text-center">
                                    <div>Replanting intensity: <span id="replanting-value">100</span>%</div>
                                    <div class="text-muted">Vineage reduction: <span id="vineage-reduction">${farmland.vineAge} → ${farmland.vineAge}</span></div>
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
                        <div class="form-check mb-3">
                            <input type="checkbox" class="form-check-input" id="soil-amendment">
                            <label class="form-check-label" for="soil-amendment">Soil Amendment</label>
                            <div class="slider-container mt-2 d-none" id="amendment-method-container">
                                <div class="d-flex align-items-center">
                                    <span class="mr-2">Synthetic</span>
                                    <input type="range" class="custom-range" id="amendment-method-slider" 
                                        min="0" max="1" step="1" value="1">
                                    <span class="ml-2">Organic</span>
                                </div>
                                <div class="text-center">
                                    <div>Method: <span id="amendment-method-value">Organic</span></div>
                                    <div class="text-muted">Current Status: ${farmland.conventional} (${farmland.organicYears}/3 years organic)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr class="overlay-divider">
                    ${createHealthBar(healthData)}
                    <div id="work-calculation-container">
                        ${createWorkCalculationTable(initialWorkData)}
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
    const healthBar = overlayContainer.querySelector('.health-bar-container');  // Updated selector to match component
    const currentHealth = farmland.farmlandHealth;
    const replantingSlider = overlayContainer.querySelector('#replanting-slider');
    const replantingValue = overlayContainer.querySelector('#replanting-value');
    const removeVinesCheckbox = overlayContainer.querySelector('#remove-vines');

    // Handle slider updates - modified to auto-check the checkbox
    replantingSlider.addEventListener('input', () => {
        const sliderValue = parseInt(replantingSlider.value);
        replantingValue.textContent = sliderValue;
        
        // Auto-check the vine replanting checkbox when slider is moved
        if (!removeVinesCheckbox.checked && !removeVinesCheckbox.disabled) {
            removeVinesCheckbox.checked = true;
            const sliderContainer = overlayContainer.querySelector('#replanting-slider-container');
            sliderContainer.style.display = 'block';
        }
        
        // Calculate new vineage
        const vineageReduction = document.querySelector('#vineage-reduction');
        if (vineageReduction && farmland.vineAge) {
            const reductionFactor = sliderValue / 100;
            const newVineage = Math.max(0, (farmland.vineAge * (1 - reductionFactor))).toFixed(2);
            vineageReduction.textContent = `${farmland.vineAge} → ${newVineage}`;
        }
        
        updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth, replantingSlider, farmland);
    });

    // Show/hide slider when vine replanting is checked/unchecked
    removeVinesCheckbox.addEventListener('change', (e) => {
        const sliderContainer = overlayContainer.querySelector('#replanting-slider-container');
        sliderContainer.style.display = e.target.checked ? 'block' : 'none';
        updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth, replantingSlider, farmland);
    });

    checkboxes.forEach(checkbox => {
        if (checkbox.id !== 'remove-vines') {
            checkbox.addEventListener('change', () => 
                updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth, replantingSlider, farmland));
        }
    });

    setupClearButton(overlayContainer, farmland, checkboxes, replantingSlider, onClearCallback);
    setupStandardOverlayClose(overlayContainer);

    // Add soil amendment checkbox and slider handlers
    const soilAmendmentCheckbox = overlayContainer.querySelector('#soil-amendment');
    const amendmentMethodSlider = overlayContainer.querySelector('#amendment-method-slider');
    const amendmentMethodValue = overlayContainer.querySelector('#amendment-method-value');
    const amendmentMethodContainer = overlayContainer.querySelector('#amendment-method-container');

    soilAmendmentCheckbox.addEventListener('change', (e) => {
        if (amendmentMethodContainer) {
            amendmentMethodContainer.classList.toggle('d-none', !e.target.checked);
        }
        updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth, replantingSlider, farmland);
    });

    amendmentMethodSlider?.addEventListener('input', () => {
        if (amendmentMethodValue) {
            amendmentMethodValue.textContent = amendmentMethodSlider.value === "1" ? "Organic" : "Synthetic";
        }
        updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth, replantingSlider, farmland);
    });
}

function updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth, replantingSlider, farmland) {
    const selectedTasks = Array.from(checkboxes).filter(cb => cb.checked);
    const replantingIntensity = selectedTasks.find(task => task.id === 'remove-vines') 
        ? parseInt(replantingSlider.value) / 100 
        : 0;

    // Calculate work using shared calculator
    const workData = calculateClearingWorkData(farmland, selectedTasks, replantingIntensity);
    
    // Update work calculation display
    const container = document.getElementById('work-calculation-container');
    container.innerHTML = createWorkCalculationTable(workData);

    // Update health bar separately
    updateHealthCalculations(selectedTasks, currentHealth, healthBar, replantingIntensity);
}

function updateHealthCalculations(selectedTasks, currentHealth, healthBar, replantingIntensity) {
    // Calculate health improvement
    const healthImprovementPerTask = DEFAULT_FARMLAND_HEALTH / 3;
    let totalHealthImprovement = selectedTasks.reduce((total, task) => {
        if (task.id === 'remove-vines') {
            return total + (healthImprovementPerTask * replantingIntensity);
        }
        return total + healthImprovementPerTask;
    }, 0);

    const newHealth = Math.min(1.0, currentHealth + totalHealthImprovement);

    // Update the health display
    const healthImprovement = healthBar.querySelector('.health-improvement');
    if (healthImprovement) {
        const improvement = newHealth - currentHealth;
        if (improvement > 0) {
            healthImprovement.textContent = `+${formatNumber(improvement * 100)}%`;
            healthImprovement.style.color = '#28a745'; // green
        } else {
            healthImprovement.textContent = ''; // Clear if no improvement
        }
    }

    // Update current health display with both values
    const currentHealthSpan = healthBar.querySelector('.current-health');
    if (currentHealthSpan) {
        currentHealthSpan.textContent = `${formatNumber(currentHealth * 100)}% → ${formatNumber(newHealth * 100)}%`;
    }

    updateHealthBar(healthBar, currentHealth, newHealth);
}

function setupClearButton(overlayContainer, farmland, checkboxes, replantingSlider, onClearCallback) {
    const clearButton = overlayContainer.querySelector('.clear-btn');
    clearButton.addEventListener('click', () => {
        const selectedTasks = Array.from(checkboxes).filter(cb => cb.checked);
        if (selectedTasks.length === 0) {
            addConsoleMessage('Please select at least one clearing task', false, true);
            return;
        }

        // Get soil amendment settings
        const amendmentMethodSlider = overlayContainer.querySelector('#amendment-method-slider');
        const soilAmendmentCheckbox = overlayContainer.querySelector('#soil-amendment');
        
        const clearingParams = {
            selectedTasks: selectedTasks.map(cb => cb.id),
            replantingIntensity: selectedTasks.find(task => task.id === 'remove-vines') 
                ? parseInt(replantingSlider.value) / 100 
                : 0,
            soilAmendment: soilAmendmentCheckbox?.checked 
                ? { isOrganic: amendmentMethodSlider?.value === "1" }
                : null
        };

        if (clearing(farmland, clearingParams)) {
            hideOverlay(overlayContainer);  // Close overlay first
            onClearCallback();  // Then run callback
        }
    });
}

function clearing(farmland, params) {
    const { selectedTasks, replantingIntensity } = params;
    
    const workData = calculateClearingWorkData(
        farmland, 
        selectedTasks.map(taskId => ({ id: taskId })), 
        replantingIntensity
    );

    const task = taskManager.addProgressiveTask(
        'Clearing',
        'field',
        workData.totalWork,
        (target, progress) => {
            const percentComplete = Math.floor(progress * 100);
            addConsoleMessage(`Clearing ${getFlagIconHTML(target.country)} ${target.name}: ${percentComplete}% complete...`, true);

            if (progress >= 1) {
                performClearing(target, params);
            }
        },
        farmland,
        params
    );

    return task !== null;
}

export function performClearing(farmland, params) {
    const { selectedTasks, replantingIntensity, soilAmendment } = params;
    const updates = { canBeCleared: 'Not ready' };

    // Calculate health improvements
    const healthImprovementPerTask = DEFAULT_FARMLAND_HEALTH / 3;
    let totalHealthImprovement = selectedTasks.reduce((total, taskId) => {
        if (taskId === 'remove-vines') {
            return total + (healthImprovementPerTask * replantingIntensity);
        }
        return total + healthImprovementPerTask;
    }, 0);

    if (soilAmendment) {
        totalHealthImprovement += healthImprovementPerTask;
    }

    // Calculate new health
    const newHealth = Math.min(1.0, farmland.farmlandHealth + totalHealthImprovement);
    updates.farmlandHealth = newHealth;

    // Handle vine replanting
    if (selectedTasks.includes('remove-vines')) {
        const newVineage = Math.max(0, (farmland.vineAge * (1 - replantingIntensity))).toFixed(2);
        updates.vineAge = parseFloat(newVineage);
    }

    // Handle soil amendment
    if (soilAmendment) {
        updates.conventional = soilAmendment.isOrganic ? 'Non-Conventional' : 'Conventional';
    }

    // Create completion message
    let message = `Clearing of ${getFlagIconHTML(farmland.country)} ${farmland.name} is done. `;
    message += `Farmland health was improved by ${formatNumber((newHealth - farmland.farmlandHealth) * 100)}%`;
    
    if (selectedTasks.includes('remove-vines')) {
        message += `. Vineage adjusted to ${updates.vineAge} years`;
    }
    if (soilAmendment) {
        message += `. Field is now ${updates.conventional}`;
    }

    // Update data and UI together
    updateFarmland(farmland.id, updates);
    addConsoleMessage(message);
    updateAllDisplays();
}

