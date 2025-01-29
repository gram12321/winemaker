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
                            <div class="slider-container mt-2 d-none" id="amendment-slider-container">
                                <div class="d-flex align-items-center">
                                    <span class="mr-2">Synthetic</span>
                                    <input type="range" class="custom-range" id="amendment-slider" 
                                        min="0" max="1" step="1" value="1">
                                    <span class="ml-2">Organic</span>
                                </div>
                                <div class="text-center">
                                    <div>Method: <span id="amendment-value">Organic</span></div>
                                    <div class="text-muted">Current Status: ${farmland.conventional} (${farmland.organicYears}/3 years organic)</div>
                                </div>
                            </div>
                        </div>
                        <hr>
                        <div class="soil-amendment-section mb-3">
                            <label class="form-label">Soil Amendment:</label>
                            <div class="form-check">
                                <input type="radio" class="form-check-input" name="amendment-type" id="organic" value="organic">
                                <label class="form-check-label" for="organic">
                                    Organic Amendment 
                                    <small class="text-muted">(Progress to Ecological: ${farmland.organicYears}/3 years)</small>
                                </label>
                            </div>
                            <div class="form-check">
                                <input type="radio" class="form-check-input" name="amendment-type" id="synthetic" value="synthetic">
                                <label class="form-check-label" for="synthetic">
                                    Synthetic Amendment
                                    <small class="text-muted">(Resets Ecological progress)</small>
                                </label>
                            </div>
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
                        <div class="table-responsive">
                            <table class="table table-sm table-bordered">
                                <tbody>
                                    <tr>
                                        <td>Field Size:</td>
                                        <td><span id="field-size">${farmland.acres.toFixed(2)}</span> acres</td>
                                    </tr>
                                    <tr>
                                        <td>Base Work per Acre:</td>
                                        <td><span id="base-work">50</span> units</td>
                                    </tr>
                                    <tr>
                                        <td>Selected Tasks:</td>
                                        <td><span id="selected-tasks">None</span></td>
                                    </tr>
                                    <tr>
                                        <td>Plant Density:</td>
                                        <td><span id="density">${formatNumber(farmland.density || 0)}</span> vines/acre</td>
                                    </tr>
                                    <tr>
                                        <td>Density Factor:</td>
                                        <td><span id="density-factor">${formatNumber((farmland.density || 0)/1000)}</span>x</td>
                                    </tr>
                                    <tr class="table-primary">
                                        <td><strong>Total Work:</strong></td>
                                        <td><strong><span id="total-work">0</span> units</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <small class="text-muted">
                            Calculation: Acres × (Base Work × (Tasks + Density Factor × Replanting Intensity))
                        </small>
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

    // Handle slider updates - modified to auto-check the checkbox
    replantingSlider.addEventListener('input', () => {
        const sliderValue = parseInt(replantingSlider.value);
        replantingValue.textContent = sliderValue;
        
        // Auto-check the vine replanting checkbox when slider is moved
        if (!removeVinesCheckbox.checked && !removeVinesCheckbox.disabled) {
            removeVinesCheckbox.checked = true;
            const sliderContainer = overlayContainer.querySelector('.slider-container');
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
        const sliderContainer = overlayContainer.querySelector('.slider-container');
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
    setupCloseButton(overlayContainer);

    // Add radio button event listeners
    const amendmentRadios = overlayContainer.querySelectorAll('input[name="amendment-type"]');
    amendmentRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth, replantingSlider, farmland);
        });
    });

    // Add soil amendment checkbox and slider handlers
    const soilAmendmentCheckbox = overlayContainer.querySelector('#soil-amendment');
    const amendmentSlider = overlayContainer.querySelector('#amendment-slider');
    const amendmentValue = overlayContainer.querySelector('#amendment-value');
    const sliderContainer = overlayContainer.querySelector('#amendment-slider-container');

    soilAmendmentCheckbox.addEventListener('change', (e) => {
        sliderContainer.style.display = e.target.checked ? 'block' : 'none';
        updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth, replantingSlider, farmland);
    });

    amendmentSlider.addEventListener('input', () => {
        amendmentValue.textContent = amendmentSlider.value === "1" ? "Organic" : "Synthetic";
        updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth, replantingSlider, farmland);
    });
}

function updateWorkCalculations(checkboxes, totalWorkSpan, healthBar, currentHealth, replantingSlider, farmland) {
    const selectedTasks = Array.from(checkboxes).filter(cb => cb.checked);
    const baseWorkPerAcre = 50;
    let totalWork = 0;
    
    // Get references to display elements
    const selectedTasksSpan = document.querySelector('#selected-tasks');
    
    if (selectedTasks.length > 0) {
        const taskNames = selectedTasks.map(task => {
            switch(task.id) {
                case 'remove-vines': return 'Vine Replanting';
                case 'clear-vegetation': return 'Vegetation';
                case 'remove-debris': return 'Debris';
                default: return task.id;
            }
        });
        selectedTasksSpan.textContent = taskNames.join(', ');
        
        // Calculate standard tasks work (vegetation and debris)
        const standardTasks = selectedTasks.filter(task => task.id !== 'remove-vines').length;
        const standardWork = farmland.acres * baseWorkPerAcre * standardTasks;

        // Calculate replanting work if selected
        const vineReplanting = selectedTasks.find(task => task.id === 'remove-vines');
        if (vineReplanting) {
            const densityFactor = (farmland.density || 0) / 1000;
            const replantingIntensity = parseInt(replantingSlider.value) / 100;
            
            // Replanting work calculation:
            // Base removal work (similar to uprooting but scaled by intensity)
            const removalWork = farmland.acres * baseWorkPerAcre * densityFactor * replantingIntensity;
            
            // Replanting work (similar to planting but scaled by intensity)
            const vinesAffected = farmland.acres * farmland.density * replantingIntensity;
            const replantingWork = (vinesAffected / 3500) * 50;  // Using planting formula
            
            totalWork = Math.ceil(standardWork + removalWork + replantingWork);
        } else {
            totalWork = Math.ceil(standardWork);
        }
    } else {
        selectedTasksSpan.textContent = 'None';
    }

    // Calculate health improvement
    const healthImprovementPerTask = 0.17;
    let totalHealthImprovement = 0;

    selectedTasks.forEach(task => {
        if (task.id === 'remove-vines') {
            const sliderPercentage = parseInt(replantingSlider.value) / 100;
            totalHealthImprovement += healthImprovementPerTask * sliderPercentage;
        } else {
            totalHealthImprovement += healthImprovementPerTask;
        }
    });

    // Add soil amendment work calculation
    const organicAmendment = document.querySelector('#organic');
    const syntheticAmendment = document.querySelector('#synthetic');
    
    if (organicAmendment && organicAmendment.checked) {
        // Organic takes more work
        totalWork += Math.ceil(farmland.acres * baseWorkPerAcre * 0.5);  // 50% extra work for organic
        totalHealthImprovement += 0.17;  // Same improvement as other tasks
    } else if (syntheticAmendment && syntheticAmendment.checked) {
        totalWork += Math.ceil(farmland.acres * baseWorkPerAcre * 0.3);  // 30% extra work for synthetic
        totalHealthImprovement += 0.17;  // Same improvement as other tasks
    }

    const newHealth = Math.min(1.0, currentHealth + totalHealthImprovement);

    // Update displays
    if (totalWorkSpan) totalWorkSpan.textContent = formatNumber(totalWork);
    updateHealthBarDisplay(healthBar, currentHealth, newHealth, totalHealthImprovement);
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

        // Calculate total work using the same formula
        const baseWorkPerAcre = 50;
        const standardTasks = selectedTasks.filter(task => task.id !== 'remove-vines').length;
        let totalWork = 0;

        if (selectedTasks.find(task => task.id === 'remove-vines')) {
            const densityFactor = (farmland.density || 0) / 1000;
            const replantingIntensity = parseInt(replantingSlider.value) / 100;
            totalWork = Math.ceil(farmland.acres * baseWorkPerAcre * (standardTasks + (densityFactor * replantingIntensity)));
        } else {
            totalWork = Math.ceil(farmland.acres * baseWorkPerAcre * standardTasks);
        }

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

        const organicAmendment = overlayContainer.querySelector('#organic');
        const syntheticAmendment = overlayContainer.querySelector('#synthetic');

        // Update conventional status and organic years
        let updates = {
            canBeCleared: 'Not ready',
            farmlandHealth: newHealth
        };

        if (organicAmendment && organicAmendment.checked) {
            updates.organicYears = (farmland.organicYears || 0) + 1;
            if (updates.organicYears >= 3) {
                updates.conventional = 'Ecological';
                addConsoleMessage(`${getFlagIconHTML(farmland.country)} ${farmland.name} is now certified Ecological!`);
            }
        } else if (syntheticAmendment && syntheticAmendment.checked) {
            updates.conventional = 'Conventional';
            updates.organicYears = 0;
        }

        taskManager.addProgressiveTask(
            'Clearing',
            TaskType.field,
            totalWork,
            (target, progress, params) => {
                // This callback runs on progress updates
                const percentComplete = Math.floor(progress * 100);
                addConsoleMessage(`Clearing ${getFlagIconHTML(target.country)} ${target.name}: ${percentComplete}% complete...`, true);
                    const vineReplanting = selectedTasks.find(task => task.id === 'remove-vines');

                if (progress >= 1) {
                    // Calculate new health value, capped at 1.0
                    const newHealth = Math.min(1.0, target.farmlandHealth + totalHealthImprovement);
                    const actualImprovement = newHealth - target.farmlandHealth;
                    
                    // Calculate new vineage if vine replanting was selected
                    let updates = {
                        canBeCleared: 'Not ready',
                        farmlandHealth: newHealth
                    };

                    const vineReplanting = selectedTasks.find(task => task.id === 'remove-vines');
                    if (vineReplanting) {
                        const reductionFactor = parseInt(replantingSlider.value) / 100;
                        const newVineage = Math.max(0, (target.vineAge * (1 - reductionFactor))).toFixed(2);
                        updates.vineAge = parseFloat(newVineage);
                    }
                    
                    // Update farmland
                    updateFarmland(target.id, updates);

                    // Final message
                    let message = `Clearing of ${getFlagIconHTML(target.country)} ${target.name} is done. Farmland health was improved by ${formatNumber(actualImprovement * 100)}%`;
                    if (vineReplanting) {
                        message += `. Vineage adjusted to ${updates.vineAge} years`;
                    }
                    addConsoleMessage(message);
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
