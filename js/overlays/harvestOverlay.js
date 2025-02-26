import { addConsoleMessage } from '../console.js';
import { showVineyardOverlay, validateStorage } from './mainpages/vineyardoverlay.js';
import { inventoryInstance, getResourceByName } from '../resource.js';
import { farmlandYield } from '../farmland.js';
import { formatNumber } from '../utils.js';
import { saveInventory, updateFarmland, loadBuildings } from '../database/adminFunctions.js';
import taskManager from '../taskManager.js';
import { regionAltitudeRanges, grapeSuitability } from '../names.js';
import { loadFarmlands } from '../database/adminFunctions.js';
import { showModalOverlay } from './overlayUtils.js';
import { createOverlayHTML, createTextCenter, createTable } from '../components/createOverlayHTML.js';
import { calculateFieldTotalWork } from '../utils/workCalculator.js';
import { createWorkCalculationTable } from '../components/workCalculationTable.js';
import { calculateHarvestCharacteristics } from '../utils/harvestCharacteristics.js';
import { applyHarvestOxidation } from '../utils/oxidationIndex.js';

export function showHarvestOverlay(farmland, farmlandId) {
    const overlayContainer = showModalOverlay('harvestOverlay', createHarvestOverlayHTML(farmland));
    if (overlayContainer) {
        setupHarvestEventListeners(overlayContainer, farmland, farmlandId);
        populateStorageOptions(farmland);
    }
    return overlayContainer;
}

// New helper function for altitude calculations
function getAltitudeParams(farmland) {
    const [minAltitude, maxAltitude] = regionAltitudeRanges[farmland.country][farmland.region];
    const medianAltitude = (minAltitude + maxAltitude) / 2;
    const altitudeDeviation = (farmland.altitude - medianAltitude) / (maxAltitude - minAltitude);

    return {
        minAltitude,
        maxAltitude,
        medianAltitude,
        altitudeEffect: altitudeDeviation * 0.5
    };
}

// Modify calculateHarvestWorkData to return workData object instead of just totalWork
function calculateHarvestWorkData(farmland, totalHarvest) {
    const altitudeParams = getAltitudeParams(farmland);
    const resource = getResourceByName(farmland.plantedResourceName);

    const workModifiers = [
        (1 - resource.fragile) * 0.5,    // fragility penalty
        altitudeParams.altitudeEffect     // altitude penalty
    ];

    const totalWork = calculateFieldTotalWork(farmland.acres, {
        density: farmland.density,
        tasks: ['HARVESTING'],
        workModifiers
    });

    return {
        acres: farmland.acres,
        density: farmland.density,
        tasks: ['HARVESTING'],
        totalWork: totalHarvest ? Math.ceil(totalWork * (totalHarvest / farmlandYield(farmland))) : totalWork,
        altitude: farmland.altitude,
        ...altitudeParams,
        robustness: resource.fragile,     // Pass fragile directly instead of inverting
        fragilityEffect: (1 - resource.fragile) * 0.5  // Keep calculation logic unchanged
    };
}

function createProgressSection(farmland) {
    const expectedYield = farmlandYield(farmland);
    return `
        <div class="card-body">
            ${createTextCenter({
                text: `
                    <div class="selected-wrapper">
                        <span>Selected Storage: </span>
                        <span id="selected-capacity">0 kg</span>
                        <span> / </span>
                        <span id="total-capacity">${expectedYield >= 1000 ? 
                            formatNumber(expectedYield/1000, 2) + ' t' : 
                            formatNumber(expectedYield) + ' kg'}</span>
                    </div>`,
                className: 'mb-2'
            })}
            <div class="w-100">
                <div class="progress">
                    <div id="selected-capacity-progress" class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
        </div>
    `;
}

function updateStorageProgress(farmland) {
    const checkboxes = document.querySelectorAll('.storage-checkbox:checked');
    let totalCapacity = 0;
    checkboxes.forEach(checkbox => {
        totalCapacity += parseFloat(checkbox.dataset.capacity);
    });

    const expectedYield = farmlandYield(farmland);
    const capacityDisplay = document.getElementById('selected-capacity');
    
    capacityDisplay.textContent = totalCapacity >= 1000 ? 
        formatNumber(totalCapacity/1000, 2) + ' t' : 
        formatNumber(totalCapacity) + ' kg';

    const progressPercentage = Math.min((totalCapacity / expectedYield) * 100, 100);
    const capacityProgress = document.getElementById('selected-capacity-progress');
    capacityProgress.style.width = `${progressPercentage}%`;
    capacityProgress.setAttribute('aria-valuenow', progressPercentage);
}

function createHarvestOverlayHTML(farmland) {
    const workData = calculateHarvestWorkData(farmland, null);

    const content = `
        ${createTable({
            headers: ['Select', 'Container', 'Capacity', 'Resource', 'Amount'],
            id: 'storage-display-body',
            className: 'overlay-table'
        })}

        <hr class="overlay-divider">
        <div class="default-overlay-content"> 
            ${createTextCenter({
                text: `Expected Yield: ${farmlandYield(farmland) >= 1000 ? 
                formatNumber(farmlandYield(farmland)/1000, 2) + ' t' : 
                formatNumber(farmlandYield(farmland)) + ' kg'}`,
                className: 'expected-yield'
            })}
            ${createProgressSection(farmland)}
            <hr class="overlay-divider">
            <div>
                ${createWorkCalculationTable(workData)}
            </div>
        </div>`;

    return createOverlayHTML({
        title: 'Harvest Options for',
        farmland,
        content,
        buttonText: 'Harvest Selected',
        buttonClass: 'btn-primary',
        buttonIdentifier: 'harvest-btn',
        isModal: true  // Add this line
    });
}

function setupHarvestEventListeners(overlayContainer, farmland, farmlandId) {
    const harvestBtn = overlayContainer.querySelector('.harvest-btn');
    const closeBtn = overlayContainer.querySelector('.close-btn');

    if (harvestBtn) {
        harvestBtn.addEventListener('click', () => handleHarvestButtonClick(farmland, farmlandId, overlayContainer));
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => removeOverlay(overlayContainer));
    }

    overlayContainer.addEventListener('click', (event) => {
        if (event.target === overlayContainer) {
            removeOverlay(overlayContainer);
        }
    });

    // Setup storage checkbox listeners
    overlayContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('storage-checkbox')) {
            updateStorageProgress(farmland);
        }
    });
}

function showWarningModal(farmland, farmlandId, selectedTools, totalAvailableCapacity, expectedYield, overlayContainer) {
    const warningModal = document.createElement('div');
    warningModal.className = 'modal fade modal-overlay';
    warningModal.style.display = 'block';
    warningModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    warningModal.innerHTML = `
    <div class="modal-dialog">
        <div class="modal-content overlay-section">
            <div class="modal-header card-header">
                <h3 class="modal-title">Warning: Limited Container Capacity</h3>
                <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <p>Selected containers have capacity for ${totalAvailableCapacity >= 1000 ? 
                    formatNumber(totalAvailableCapacity/1000, 2) + ' t' : 
                    formatNumber(totalAvailableCapacity) + ' kg'} 
                   of the remaining ${expectedYield >= 1000 ? 
                    formatNumber(expectedYield/1000, 2) + ' t' : 
                    formatNumber(expectedYield) + ' kg'} to harvest.</p>
                <p>Do you want to harvest what fits in the containers?</p>
            </div>
                <div class="modal-footer">
                    <button type="button" class="overlay-section-btn" data-dismiss="modal">Cancel</button>
                    <button type="button" class="overlay-section-btn" id="confirmHarvest">Harvest Available</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(warningModal);
    $(warningModal).modal('show');

    document.getElementById('confirmHarvest').addEventListener('click', () => {
        harvest(farmland, farmlandId, selectedTools, totalAvailableCapacity); // This line is now correct
        $(warningModal).modal('hide');
        warningModal.remove();
        removeOverlay(overlayContainer);
    });

    warningModal.addEventListener('hidden.bs.modal', () => {
        warningModal.remove();
    });
}

export function performHarvest(farmland, farmlandId, selectedTools, harvestedAmount) {
    if (!Array.isArray(selectedTools) || selectedTools.length === 0 || harvestedAmount <= 0) return false;

    const toolsArray = selectedTools.map(t => t.toString());
    const buildings = loadBuildings();
    let remainingHarvest = harvestedAmount;
    let totalStoredAmount = 0;

    const gameYear = parseInt(localStorage.getItem('year'), 10);
    const currentFarmland = loadFarmlands().find(f => f.id === parseInt(farmlandId));
    if (!currentFarmland) return false;

    const suitability = grapeSuitability[farmland.country]?.[farmland.region]?.[farmland.plantedResourceName];
    const quality = ((farmland.annualQualityFactor + currentFarmland.ripeness + suitability) / 3).toFixed(2);

    // Use the shared altitude parameters function
    const { medianAltitude, maxAltitude } = getAltitudeParams(farmland);

    const harvestParams = {
        ripeness: currentFarmland.ripeness,
        qualityFactor: farmland.annualQualityFactor,
        suitability,
        altitude: farmland.altitude,
        medianAltitude,
        maxAltitude
    };

    // Get base characteristics from resource
    const resourceObj = getResourceByName(farmland.plantedResourceName);
    const harvestedCharacteristics = calculateHarvestCharacteristics(
        resourceObj.wineCharacteristics,
        harvestParams
    );

    // Process each tool in sequence
    for (const selectedTool of toolsArray) {
        if (remainingHarvest <= 0) break;

        const tool = buildings.flatMap(b => 
            b.slots.flatMap(slot => 
                slot.tools.find(t => t.getStorageId() === selectedTool)
            )
        ).find(t => t);

        if (!tool) continue;

        const currentAmount = inventoryInstance.items
            .filter(item => item.storage === selectedTool)
            .reduce((sum, item) => sum + item.amount, 0);
        const availableCapacity = tool.capacity - currentAmount;

        if (availableCapacity <= 0) continue;

        const amountForTool = Math.min(remainingHarvest, availableCapacity);
        const matchingGrapes = inventoryInstance.items.find(item =>
            item.storage === selectedTool && 
            item.state === 'Grapes' &&
            item.resource.name === farmland.plantedResourceName &&
            item.vintage === gameYear
        );

        if (matchingGrapes) {
            // Blend characteristics based on amounts
            const totalAmount = matchingGrapes.amount + amountForTool;
            Object.keys(harvestedCharacteristics).forEach(characteristic => {
                matchingGrapes[characteristic] = (
                    (matchingGrapes[characteristic] * matchingGrapes.amount) +
                    (harvestedCharacteristics[characteristic] * amountForTool)
                ) / totalAmount;
            });
            matchingGrapes.amount = totalAmount;
            matchingGrapes.quality = ((matchingGrapes.quality * matchingGrapes.amount) + (quality * amountForTool)) / totalAmount;
            // Add ripeness value from farmland
            matchingGrapes.ripeness = currentFarmland.ripeness;
            applyHarvestOxidation(matchingGrapes);
        } else {
            const newGrapes = inventoryInstance.addResource(
                resourceObj,
                amountForTool,
                'Grapes',
                gameYear,
                quality,
                farmland.name,
                farmland.farmlandPrestige,
                selectedTool
            );
            if (newGrapes) {
                Object.assign(newGrapes, harvestedCharacteristics);
                // Add ripeness value from farmland
                newGrapes.ripeness = currentFarmland.ripeness;
                applyHarvestOxidation(newGrapes);
            }
        }

        totalStoredAmount += amountForTool;
        remainingHarvest -= amountForTool;
        addConsoleMessage(`Harvested ${formatNumber(amountForTool)} kg of ${farmland.plantedResourceName} with quality ${quality} from ${farmland.name} to ${selectedTool}`);
    }

    if (totalStoredAmount > 0) {
        saveInventory();
        return true;
    }
    return false;
}

// New helper function for grape compatibility check
function checkGrapeCompatibility(selectedTool, farmland) {
    const existingGrapes = inventoryInstance.items.find(item => 
        item.storage === selectedTool && 
        item.state === 'Grapes' &&
        (item.resource.name !== farmland.plantedResourceName || 
         parseInt(item.vintage) !== parseInt(localStorage.getItem('year')))
    );

    if (existingGrapes) {
        return {
            compatible: false,
            message: `Cannot mix different grapes or vintages in container ${selectedTool}. Contains ${existingGrapes.resource.name} from ${existingGrapes.vintage}`
        };
    }

    return { compatible: true };
}

// Update harvest function to use the helper
export function harvest(farmland, farmlandId, selectedTools, totalHarvest) {
    if (!Array.isArray(selectedTools) || selectedTools.length === 0) return false;

    const toolsArray = selectedTools.map(t => t.toString());
    
    // Check compatibility for all selected tools
    for (const toolId of toolsArray) {
        const compatibility = checkGrapeCompatibility(toolId, farmland);
        if (!compatibility.compatible) {
            addConsoleMessage(compatibility.message);
            return false;
        }
    }

    const { totalWork } = calculateHarvestWorkData(farmland, totalHarvest);

    taskManager.addProgressiveTask(
        'Harvesting',
        'field',
        totalWork,
        (target, progress, params) => {
            // These two checks are necessary because the values might be undefined when the task starts
            target.remainingYield ??= farmlandYield(target);
            params.lastProgress ??= 0;

            const progressIncrement = progress - params.lastProgress;
            const harvestedAmount = Math.min(
                target.remainingYield,
                totalHarvest * progressIncrement
            );

            if (harvestedAmount > 0) {
                params.lastProgress = progress;
                target.remainingYield -= harvestedAmount;
                
                if (performHarvest(target, farmlandId, toolsArray, harvestedAmount)) {
                    updateFarmland(farmlandId, {
                        remainingYield: target.remainingYield,
                        status: target.remainingYield <= 0 ? 'Harvested' : 'Partially Harvested',
                        ripeness: target.remainingYield <= 0 ? 0 : target.ripeness
                    });
                }
            }
        },
        farmland,
        {
            selectedTools: toolsArray,
            totalHarvest,
            lastProgress: 0
        }
    );

    return true;
}

function populateStorageOptions(farmland) {
    const storageBody = document.getElementById('storage-display-body');
    const buildings = loadBuildings();
    const activeTasks = taskManager.getAllTasks();

    buildings.forEach(building => {
        if (!building.slots) return;

        building.slots.forEach(slot => {
            slot.tools.forEach(tool => {
                // Fix: Only show tools that:
                // 1. Support grapes storage
                // 2. Have capacity > 0
                // 3. Are marked as storage tools (assignable === false)
                if (tool.supportedResources?.includes('Grapes') && 
                    tool.capacity > 0 && 
                    tool.assignable === false) {
                    const toolId = `${tool.name} #${tool.instanceNumber}`;
                    const playerInventory = inventoryInstance.items;
                    const matchingInventoryItems = playerInventory.filter(item => 
                        item.storage === toolId && 
                        item.state === 'Grapes'
                    );
                    const currentAmount = matchingInventoryItems.reduce((sum, item) => sum + item.amount, 0);
                    const availableCapacity = tool.capacity - currentAmount;
                    
                    // Check if storage is in use or contains incompatible contents
                    const isInUse = activeTasks.some(task => 
                        task.name === 'Harvesting' && 
                        task.params.selectedTools?.includes(toolId)
                    );
                    const hasIncompatibleContents = matchingInventoryItems.some(item => 
                        item.resource.name !== farmland.plantedResourceName ||
                        item.vintage !== parseInt(localStorage.getItem('year'))
                    );
                    
                    const taskUsingStorage = isInUse ? 
                        activeTasks.find(task => 
                            task.name === 'Harvesting' && 
                            task.params.selectedTools?.includes(toolId)
                        ) : null;

                    // Show all containers, but disable if unavailable
                    const row = document.createElement('tr');
                    const firstItem = matchingInventoryItems[0];
                    const isDisabled = isInUse || hasIncompatibleContents;

                    if (isDisabled) {
                        row.classList.add('harvest-tool', 'disabled');
                    }

                    row.innerHTML = `
                        <td>
                            <input type="checkbox" 
                                   class="storage-checkbox" 
                                   data-capacity="${availableCapacity}" 
                                   value="${toolId}"
                                   style="accent-color: var(--color-primary);"
                                   ${isDisabled ? 'disabled' : ''}>
                        </td>
                        <td>${toolId}
                            ${isInUse ? `
                                <br><small class="text-warning">
                                    In use by harvest task for ${taskUsingStorage.target.name}
                                </small>
                            ` : ''}
                            ${hasIncompatibleContents ? `
                                <br><small class="text-warning">
                                    Contains different grapes or vintage
                                </small>
                            ` : ''}
                        </td>
                        <td>${tool.capacity >= 1000 ? formatNumber(tool.capacity/1000, 2) + ' t' : formatNumber(tool.capacity) + ' kg'}</td>
                        <td>${firstItem ? `${firstItem.fieldName}, ${firstItem.resource.name}, ${firstItem.vintage}` : 'Empty'}</td>
                        <td>${currentAmount >= 1000 ? formatNumber(currentAmount/1000, 2) + ' t' : formatNumber(currentAmount) + ' kg'}</td>
                    `;
                    storageBody.appendChild(row);

                    if (!isDisabled && availableCapacity > 0) {
                        row.querySelector('.storage-checkbox').addEventListener('change', function() {
                            updateStorageProgress(farmland);
                        });
                    }
                }
            });
        });
    });
}

function handleHarvestButtonClick(farmland, farmlandId, overlayContainer) {
    const selectedCheckboxes = overlayContainer.querySelectorAll('.storage-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        addConsoleMessage('Please select at least one storage container for harvesting');
        return;
    }

    // Get all selected tools and their capacities
    const selectedTools = Array.from(selectedCheckboxes).map(checkbox => checkbox.value);
    let totalAvailableCapacity = Array.from(selectedCheckboxes).reduce((total, checkbox) => {
        const storageCheck = validateStorage(farmland, checkbox.value);
        return total + storageCheck.availableCapacity;
    }, 0);

    const expectedYield = farmlandYield(farmland);
    
    if (totalAvailableCapacity < expectedYield) {
        showWarningModal(farmland, farmlandId, selectedTools, totalAvailableCapacity, expectedYield, overlayContainer);
    } else {
        harvest(farmland, farmlandId, selectedTools, expectedYield);
        removeOverlay(overlayContainer);
    }
}

function removeOverlay(overlayContainer) {
    if (overlayContainer && overlayContainer.parentNode) {
        overlayContainer.parentNode.removeChild(overlayContainer);
    }
    const vineyardOverlay = document.querySelector('.mainview-overlay');
    if (vineyardOverlay) {
        showVineyardOverlay();
    }
}