import { getBuildingTools } from '../buildings.js';
import { addConsoleMessage } from '../console.js';
import { showVineyardOverlay } from './mainpages/vineyardoverlay.js';
import { inventoryInstance, allResources } from '../resource.js';
import { farmlandYield, canHarvest } from '../vineyard.js';
import { formatNumber, getFlagIconHTML } from '../utils.js';
import { saveInventory, updateFarmland, loadBuildings } from '../database/adminFunctions.js';
import taskManager from '../taskManager.js';
import { regionAltitudeRanges, grapeSuitability } from '../names.js';
import { loadFarmlands } from '../database/adminFunctions.js';
import { showModalOverlay } from './overlayUtils.js';

export function showHarvestOverlay(farmland, farmlandId) {
    const overlayContainer = showModalOverlay('harvestOverlay', createHarvestHTML(farmland));
    if (overlayContainer) {
        setupHarvestEventListeners(overlayContainer, farmland, farmlandId);
        populateStorageOptions(farmland);
    }
    return overlayContainer;
}

function createHarvestHTML(farmland) {
    return `
        <div class="overlay-section-wrapper">
            <section class="overlay-section card">
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
                <div class="button-container">
                    <div class="selected-wrapper">
                        <span>Expected Yield: </span>
                        <span id="expected-yield">${farmlandYield(farmland) >= 1000 ? formatNumber(farmlandYield(farmland)/1000, 2) + ' t' : formatNumber(farmlandYield(farmland)) + ' kg'}</span>
                    </div>
                    <div class="w-100">
                        <span>Selected Capacity: </span>
                        <span id="selected-capacity">0 kg</span>
                        <div class="progress">
                            <div id="selected-capacity-progress" class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                    <button class="overlay-section-btn harvest-btn mt-3">Harvest Selected</button>
                </div>
            </section>
        </div>
    `;
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
            updateSelectedCapacity(farmland);
        }
    });
}

function showWarningModal(farmland, farmlandId, selectedCheckboxes, totalAvailableCapacity, expectedYield, overlayContainer) {
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
        let remainingCapacity = totalAvailableCapacity;
        let success = true;

        // Distribute harvest among containers, limited by available capacity
        for (const checkbox of selectedCheckboxes) {
            const selectedTool = checkbox.value;
            const harvestCheck = canHarvest(farmland, selectedTool);
            
            // Only harvest up to the available capacity
            const amountToHarvest = Math.min(remainingCapacity, harvestCheck.availableCapacity);
            
            if (amountToHarvest > 0) {
                harvest(farmland, farmlandId, selectedTool, amountToHarvest);
                remainingCapacity -= amountToHarvest;
            }

            // Stop if we've used all available capacity
            if (remainingCapacity <= 0) break;
        }

        if (success) {
            $(warningModal).modal('hide');
            warningModal.remove();
            removeOverlay(overlayContainer); 
        }
    });

    warningModal.addEventListener('hidden.bs.modal', () => {
        warningModal.remove();
    });
}

export function performHarvest(farmland, farmlandId, selectedTool, harvestedAmount) {
    if (harvestedAmount <= 0) return false;

    // Check container capacity before processing
    const tool = loadBuildings().flatMap(b => 
        b.slots.flatMap(slot => 
            slot.tools.find(t => `${t.name} #${t.instanceNumber}` === selectedTool)
        )
    ).find(t => t);

    // Calculate available capacity
    const currentAmount = inventoryInstance.items
        .filter(item => item.storage === selectedTool)
        .reduce((sum, item) => sum + item.amount, 0);
    const availableCapacity = tool.capacity - currentAmount;

    // Limit harvest amount to available capacity
    const limitedHarvestAmount = Math.min(harvestedAmount, availableCapacity);

    if (limitedHarvestAmount <= 0) {
        addConsoleMessage(`No capacity available in ${selectedTool}`);
        return false;
    }

    const gameYear = parseInt(localStorage.getItem('year'), 10);
    const suitability = grapeSuitability[farmland.country]?.[farmland.region]?.[farmland.plantedResourceName] || 0.5;
    const farmlands = loadFarmlands();
    const currentFarmland = farmlands.find(f => f.id === parseInt(farmlandId));

    if (!currentFarmland) {
        console.error(`Farmland with ID ${farmlandId} not found in ${farmlands.length} farmlands.`);
        return;
    }

    const quality = ((farmland.annualQualityFactor + currentFarmland.ripeness + suitability) / 3).toFixed(2);

    // Find matching grapes to combine with (same type, vintage, and storage)
    const matchingGrapes = inventoryInstance.items.find(item =>
        item.storage === selectedTool && 
        item.state === 'Grapes' &&
        item.resource.name === farmland.plantedResourceName &&
        item.vintage === gameYear
    );

    if (matchingGrapes) {
        // Combine with existing grapes
        const totalAmount = matchingGrapes.amount + limitedHarvestAmount;
        const newQuality = ((matchingGrapes.quality * matchingGrapes.amount) + (quality * limitedHarvestAmount)) / totalAmount;
        matchingGrapes.amount = totalAmount;
        matchingGrapes.quality = newQuality.toFixed(2);
    } else {
        // Create new inventory entry
        inventoryInstance.addResource(
            { name: farmland.plantedResourceName, naturalYield: 1 },
            limitedHarvestAmount,
            'Grapes',
            gameYear,
            quality,
            farmland.name,
            farmland.farmlandPrestige,
            selectedTool
        );
    }

    saveInventory();
    addConsoleMessage(`Harvested ${formatNumber(limitedHarvestAmount)} kg of ${farmland.plantedResourceName} with quality ${quality} from ${farmland.name}`);
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
export function harvest(farmland, farmlandId, selectedTool, totalHarvest) {
    const buildings = loadBuildings();
    const resourceObj = allResources.find(r => r.name === farmland.plantedResourceName);
    
    const tool = buildings.flatMap(b => 
        b.slots.flatMap(slot => 
            slot.tools.find(t => `${t.name} #${t.instanceNumber}` === selectedTool)
        )
    ).find(t => t);

    if (!tool) {
        console.error('Tool not found:', selectedTool);
        return false;
    }

    const compatibility = checkGrapeCompatibility(selectedTool, farmland);
    if (!compatibility.compatible) {
        addConsoleMessage(compatibility.message);
        return false;
    }

    const taskName = `Harvesting`;
    const densityPenalty = Math.max(0, (farmland.density - 1000) / 1000) * 0.05;
    const fragilePenalty = (1 - resourceObj.fragile) * 0.5; 
    const [minAltitude, maxAltitude] = regionAltitudeRanges[farmland.country][farmland.region];
    const medianAltitude = (minAltitude + maxAltitude) / 2;
    const altitudeDeviation = (farmland.altitude - medianAltitude) / (maxAltitude - minAltitude);
    const altitudePenalty = altitudeDeviation * 0.5; 
    const totalWork = totalHarvest / 1000 * 25 * (1 + densityPenalty + altitudePenalty + fragilePenalty); 

    taskManager.addProgressiveTask(
        taskName,
        'field',  // Changed from TaskType.field
        totalWork,
        (target, progress, params) => {
            const harvestedAmount = totalHarvest * (progress - (params.lastProgress || 0));
            params.lastProgress = progress;
            performHarvest(target, farmlandId, params.selectedTool, harvestedAmount);
            if (progress >= 1) {
                updateFarmland(farmlandId, { ripeness: 0, status: 'Harvested' });
            }
        },
        farmland,
        { selectedTool, totalHarvest, lastProgress: 0 }
    );

    return true;
}

function populateStorageOptions(farmland) {
    const storageBody = document.getElementById('storage-display-body');
    const buildings = loadBuildings();

    buildings.forEach(building => {
        if (building.slots) {
            building.slots.forEach(slot => {
                slot.tools.forEach(tool => {
                    if (tool.supportedResources?.includes('Grapes')) {
                        const toolId = `${tool.name} #${tool.instanceNumber}`;
                        const playerInventory = inventoryInstance.items;
                        const matchingInventoryItems = playerInventory.filter(item => 
                            item.storage === toolId && 
                            item.state === 'Grapes'
                        );
                        const currentAmount = matchingInventoryItems.reduce((sum, item) => sum + item.amount, 0);
                        const availableCapacity = tool.capacity - currentAmount;

                        // Only show containers with available capacity
                        if (availableCapacity > 0) {
                            const row = document.createElement('tr');
                            const firstItem = matchingInventoryItems[0];

                            row.innerHTML = `
                                <td><input type="checkbox" class="storage-checkbox" data-capacity="${availableCapacity}" value="${toolId}" style="accent-color: var(--color-primary);"></td>
                                <td>${toolId}</td>
                                <td>${tool.capacity >= 1000 ? formatNumber(tool.capacity/1000, 2) + ' t' : formatNumber(tool.capacity) + ' kg'}</td>
                                <td>${firstItem ? `${firstItem.fieldName}, ${firstItem.resource.name}, ${firstItem.vintage}` : 'Empty'}</td>
                                <td>${currentAmount >= 1000 ? formatNumber(currentAmount/1000, 2) + ' t' : formatNumber(currentAmount) + ' kg'}</td>
                            `;
                            storageBody.appendChild(row);

                            row.querySelector('.storage-checkbox').addEventListener('change', function() {
                                updateSelectedCapacity(farmland);
                            });
                        }
                    }
                });
            });
        }
    });
}

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

function handleHarvestButtonClick(farmland, farmlandId, overlayContainer) {
    const selectedCheckboxes = overlayContainer.querySelectorAll('.storage-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        addConsoleMessage('Please select at least one storage container for harvesting');
        return;
    }

    const expectedYield = farmlandYield(farmland);
    
    // Check compatibility for all selected containers first
    for (const checkbox of selectedCheckboxes) {
        const selectedTool = checkbox.value;
        const compatibility = checkGrapeCompatibility(selectedTool, farmland);
        if (!compatibility.compatible) {
            addConsoleMessage(compatibility.message);
            return;
        }
    }

    // Then check capacity
    let totalAvailableCapacity = 0;
    let harvestWarning = false;

    selectedCheckboxes.forEach(checkbox => {
        const selectedTool = checkbox.value;
        const harvestCheck = canHarvest(farmland, selectedTool);
        totalAvailableCapacity += harvestCheck.availableCapacity;
        if (harvestCheck.warning) {
            harvestWarning = true;
        }
    });

    // Show warning only if capacity is insufficient
    if (totalAvailableCapacity < expectedYield) {
        showWarningModal(farmland, farmlandId, selectedCheckboxes, totalAvailableCapacity, expectedYield, overlayContainer);
    } else {
        let remainingYield = expectedYield;
        for (const checkbox of selectedCheckboxes) {
            const selectedTool = checkbox.value;
            const harvestCheck = canHarvest(farmland, selectedTool);
            // Limit harvest amount to available capacity
            const amountToHarvest = Math.min(remainingYield, harvestCheck.availableCapacity);
            if (amountToHarvest > 0) {
                harvest(farmland, farmlandId, selectedTool, amountToHarvest);
            }
            remainingYield -= amountToHarvest;
            if (remainingYield <= 0) break;
        }
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