import { getBuildingTools } from '../buildings.js';
import { addConsoleMessage } from '../console.js';
import { showVineyardOverlay } from './mainpages/vineyardoverlay.js';
import { inventoryInstance } from '../resource.js';
import { farmlandYield, canHarvest } from '../vineyard.js';
import { formatNumber } from '../utils.js';
import { saveInventory, updateFarmland, loadBuildings } from '../database/adminFunctions.js';
import taskManager, { TaskType } from '../taskManager.js';

/**
 * Centralized function to perform the harvest logic
 * @param {Object} farmland - The farmland object
 * @param {number} farmlandId - The ID of the farmland
 * @param {string} selectedTool - The storage container identifier
 * @param {number} harvestedAmount - The amount harvested
 */
export function performHarvest(farmland, farmlandId, selectedTool, harvestedAmount) {
    const gameYear = parseInt(localStorage.getItem('year'), 10);
    const quality = ((farmland.annualQualityFactor + farmland.ripeness) / 2).toFixed(2);

    // Add harvested grapes to inventory using inventoryInstance
    inventoryInstance.addResource(
        { name: farmland.plantedResourceName, naturalYield: 1 },
        harvestedAmount,
        'Grapes',
        gameYear,
        quality,
        farmland.name,
        farmland.farmlandPrestige,
        selectedTool
    );

    // Update farmland status using adminFunctions
    updateFarmland(farmlandId, { ripeness: 0, status: 'Harvested' });

    saveInventory();
    addConsoleMessage(`Harvested ${formatNumber(harvestedAmount)} kg of ${farmland.plantedResourceName} with quality ${quality} from ${farmland.name}`);
}

/**
 * Handles the harvesting of grapes from a farmland
 * @param {Object} farmland - The farmland to harvest from
 * @param {number} farmlandId - ID of the farmland
 * @param {string} selectedTool - The storage container identifier
 * @param {number} totalHarvest - The total amount to be harvested
 * @returns {boolean} True if harvest successful, false otherwise
 */
function harvest(farmland, farmlandId, selectedTool, totalHarvest) {
    const buildings = loadBuildings();
    const tool = buildings.flatMap(b => b.tools).find(t => 
        `${t.name} #${t.instanceNumber}` === selectedTool
    );

    if (!tool) {
        addConsoleMessage("Storage container not found");
        return false;
    }

    // Check if container already has different grapes or vintage using inventoryInstance
    const existingGrapes = inventoryInstance.items.find(item => 
        item.storage === selectedTool && 
        item.state === 'Grapes' &&
        (item.resource.name !== farmland.plantedResourceName || 
         parseInt(item.vintage) !== parseInt(localStorage.getItem('year')))
    );

    if (existingGrapes) {
        addConsoleMessage(`Cannot mix different grapes or vintages in the same container. ${selectedTool} contains ${existingGrapes.resource.name} from ${existingGrapes.vintage}`);
        return false;
    }

    // Initiate the harvest task using the taskManager system
    const taskName = `Harvesting`;
    const totalWork = totalHarvest; // Assuming 1 unit of work per kg of harvest

    taskManager.addProgressiveTask(
        taskName,
        TaskType.field,
        totalWork,
        (target, progress, params) => {
            const harvestedAmount = totalHarvest * (progress - (params.lastProgress || 0));
            params.lastProgress = progress;
            performHarvest(target, farmlandId, params.selectedTool, harvestedAmount);
        },
        farmland,
        { selectedTool, totalHarvest, lastProgress: 0 }
    );

    return true;
}

/**
 * Populates storage options in the overlay
 * @param {Object} farmland - The farmland object
 */
function populateStorageOptions(farmland) {
    const storageBody = document.getElementById('storage-display-body');
    const buildings = loadBuildings();
    const playerInventory = inventoryInstance.items;

    buildings.forEach(building => {
        if (building.tools) {
            building.tools.forEach(tool => {
                if (tool.supportedResources?.includes('Grapes')) {
                    const toolId = `${tool.name} #${tool.instanceNumber}`;
                    const matchingInventoryItems = playerInventory.filter(item => 
                        item.storage === toolId && 
                        item.state === 'Grapes'
                    );
                    const currentAmount = matchingInventoryItems.reduce((sum, item) => sum + item.amount, 0);

                    const row = document.createElement('tr');
                    const firstItem = matchingInventoryItems[0];

                    row.innerHTML = `
                        <td><input type="checkbox" class="storage-checkbox" data-capacity="${tool.capacity - currentAmount}" value="${toolId}" style="accent-color: var(--color-primary);"></td>
                        <td>${toolId}</td>
                        <td>${tool.capacity >= 1000 ? formatNumber(tool.capacity/1000, 2) + ' t' : formatNumber(tool.capacity) + ' kg'}</td>
                        <td>${firstItem ? `${firstItem.fieldName}, ${firstItem.resource.name}, ${firstItem.vintage}` : 'Empty'}</td>
                        <td>${currentAmount >= 1000 ? formatNumber(currentAmount/1000, 2) + ' t' : formatNumber(currentAmount) + ' kg'}</td>
                    `;
                    storageBody.appendChild(row);

                    // Add event listener to update selected capacity
                    row.querySelector('.storage-checkbox').addEventListener('change', function() {
                        updateSelectedCapacity(farmland);
                    });
                }
            });
        }
    });
}

/**
 * Updates the selected capacity display in the overlay
 * @param {Object} farmland - The farmland object
 */
function updateSelectedCapacity(farmland) {
    const checkboxes = document.querySelectorAll('.storage-checkbox:checked');
    let totalCapacity = 0;
    checkboxes.forEach(checkbox => {
        totalCapacity += parseFloat(checkbox.dataset.capacity);
    });
    const capacityDisplay = document.getElementById('selected-capacity');
    capacityDisplay.textContent = totalCapacity >= 1000 ? 
        formatNumber(totalCapacity/1000, 2) + ' t' : 
        formatNumber(totalCapacity) + ' kg';

    const expectedYield = farmlandYield(farmland);
    const capacityProgress = document.getElementById('selected-capacity-progress');
    const progressPercentage = Math.min((totalCapacity / expectedYield) * 100, 100);
    capacityProgress.style.width = `${progressPercentage}%`;
    capacityProgress.setAttribute('aria-valuenow', progressPercentage);
}

/**
 * Creates the harvest options table in the overlay
 * @param {Object} farmland - The farmland object
 */
function createHarvestOptionsTable(farmland) {
    const overlayContainer = document.createElement('div');
    overlayContainer.className = 'overlay';

    overlayContainer.innerHTML = `
        <div class="overlay-content">
            <div class="overlay-section">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h3>Harvest Options for ${farmland.name}</h3>
                    <button class="overlay-section-btn close-btn">Close</button>
                </div>
                <div class="card-body">
                    <table class="table table-bordered overlay-table">
                        <thead>
                            <tr>
                                <th>Select</th>
                                <th>Container</th>
                                <th>Capacity</th>
                                <th>Resource</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody id="storage-display-body">
                        </tbody>
                    </table>
                </div>
                <div class="button-container d-flex flex-column align-items-center mt-3 mb-3 px-3">
                    <div class="mb-2">
                        <span>Expected Yield: </span>
                        <span id="expected-yield">${farmlandYield(farmland) >= 1000 ? formatNumber(farmlandYield(farmland)/1000, 2) + ' t' : formatNumber(farmlandYield(farmland)) + ' kg'}</span>
                    </div>
                    <div class="w-100">
                        <span>Selected Capacity: </span>
                        <span id="selected-capacity">0 kg</span>
                        <div class="progress" style="height: 20px; background-color: var(--color-background); border: 1px solid var(--color-accent); border-radius: var(--radius-md);">
                            <div id="selected-capacity-progress" class="progress-bar" role="progressbar" style="width: 0%; background-color: var(--color-primary);" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                    <button class="overlay-section-btn harvest-btn mt-3" style="background-color: var(--color-primary); color: var(--panel-text); border: 1px solid var(--color-accent); border-radius: var(--radius-md);">Harvest Selected</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlayContainer);
    return overlayContainer;
}

/**
 * Handles the harvest button click event
 * @param {Object} farmland - The farmland object
 * @param {number} farmlandId - The ID of the farmland
 * @param {HTMLElement} overlayContainer - The overlay container element
 */
function handleHarvestButtonClick(farmland, farmlandId, overlayContainer) {
    overlayContainer.querySelector('.harvest-btn').addEventListener('click', () => {
        const selectedCheckboxes = overlayContainer.querySelectorAll('.storage-checkbox:checked');
        if (selectedCheckboxes.length === 0) {
            addConsoleMessage('Please select at least one storage container for harvesting');
            return;
        }

        const expectedYield = farmlandYield(farmland);
        let totalAvailableCapacity = 0;
        let harvestWarning = false;

        // Calculate total available capacity across all selected containers
        selectedCheckboxes.forEach(checkbox => {
            const selectedTool = checkbox.value;
            const harvestCheck = canHarvest(farmland, selectedTool);
            if (harvestCheck && harvestCheck.warning) {
                totalAvailableCapacity += harvestCheck.availableCapacity;
                harvestWarning = true;
            } else if (!harvestCheck.warning) {
                totalAvailableCapacity += expectedYield;
            }
        });

        if (harvestWarning && totalAvailableCapacity < expectedYield) {
            showWarningModal(farmland, farmlandId, selectedCheckboxes, totalAvailableCapacity, expectedYield);
        } else {
            // If total capacity is sufficient, initiate harvest task for each container
            let remainingYield = expectedYield;
            for (const checkbox of selectedCheckboxes) {
                const selectedTool = checkbox.value;
                const amountToHarvest = Math.min(remainingYield, canHarvest(farmland, selectedTool).availableCapacity || expectedYield);
                if (amountToHarvest > 0) {
                    harvest(farmland, farmlandId, selectedTool, amountToHarvest);
                }
                remainingYield -= amountToHarvest;
                if (remainingYield <= 0) break;
            }
            removeOverlay(overlayContainer);
        }
    });
}

/**
 * Shows a warning modal if the total available capacity is less than the expected yield
 * @param {Object} farmland - The farmland object
 * @param {number} farmlandId - The ID of the farmland
 * @param {NodeList} selectedCheckboxes - The selected checkboxes
 * @param {number} totalAvailableCapacity - The total available capacity
 * @param {number} expectedYield - The expected yield
 */
function showWarningModal(farmland, farmlandId, selectedCheckboxes, totalAvailableCapacity, expectedYield) {
    const warningModal = document.createElement('div');
    warningModal.className = 'modal fade';
    warningModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content overlay-section">
                <div class="modal-header card-header">
                    <h3 class="modal-title">Warning: Limited Container Capacity</h3>
                    <button type="button" class="close" data-dismiss="modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Selected containers only have total capacity for ${totalAvailableCapacity >= 1000 ? formatNumber(totalAvailableCapacity/1000, 2) + ' t' : formatNumber(totalAvailableCapacity) + ' kg'} out of expected ${expectedYield >= 1000 ? formatNumber(expectedYield/1000, 2) + ' t' : formatNumber(expectedYield) + ' kg'}.</p>
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
        let remainingYield = totalAvailableCapacity;
        let success = true;

        // Distribute harvest among containers
        for (const checkbox of selectedCheckboxes) {
            const selectedTool = checkbox.value;
            const harvestCheck = canHarvest(farmland, selectedTool);
            const amount = Math.min(remainingYield, harvestCheck.availableCapacity || expectedYield);
            
            if (amount > 0) {
                harvest(farmland, farmlandId, selectedTool, amount);
            }
            remainingYield -= amount;
            if (remainingYield <= 0) break;
        }

        if (success) {
            $(warningModal).modal('hide');
            warningModal.remove();
            removeOverlay();
        }
    });

    warningModal.addEventListener('hidden.bs.modal', () => {
        warningModal.remove();
    });
}

/**
 * Removes the overlay from the DOM
 * @param {HTMLElement} overlayContainer - The overlay container element
 */
function removeOverlay(overlayContainer) {
    document.body.removeChild(overlayContainer);
    // Update vineyard overlay to reflect changes
    const vineyardOverlay = document.querySelector('.mainview-overlay');
    if (vineyardOverlay) {
        showVineyardOverlay();
    }
}

/**
 * Shows the harvest overlay for a given farmland
 * @param {Object} farmland - The farmland object
 * @param {number} farmlandId - The ID of the farmland
 */
export function showHarvestOverlay(farmland, farmlandId) {
    const overlayContainer = createHarvestOptionsTable(farmland);
    populateStorageOptions(farmland);
    handleHarvestButtonClick(farmland, farmlandId, overlayContainer);

    const closeButton = overlayContainer.querySelector('.close-btn');
    closeButton.addEventListener('click', () => removeOverlay(overlayContainer));
    overlayContainer.addEventListener('click', (event) => {
        if (event.target === overlayContainer) removeOverlay(overlayContainer);
    });
}