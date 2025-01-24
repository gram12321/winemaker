import { getBuildingTools } from '../buildings.js';
import { addConsoleMessage } from '../console.js';
import { showVineyardOverlay } from './mainpages/vineyardoverlay.js';
import { inventoryInstance, allResources } from '../resource.js';
import { farmlandYield, canHarvest } from '../vineyard.js';
import { formatNumber, getFlagIconHTML } from '../utils.js';
import { saveInventory, updateFarmland, loadBuildings } from '../database/adminFunctions.js';
import taskManager, { TaskType } from '../taskManager.js';
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
            removeOverlay(overlayContainer); 
        }
    });

    warningModal.addEventListener('hidden.bs.modal', () => {
        warningModal.remove();
    });
}

export function performHarvest(farmland, farmlandId, selectedTool, harvestedAmount) {
    if (harvestedAmount <= 0) {
        return false; // Skip if no grapes were actually harvested
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

    const existingItem = inventoryInstance.items.find(item =>
        item.resource.name === farmland.plantedResourceName &&
        item.state === 'Grapes' &&
        item.vintage === gameYear &&
        item.storage === selectedTool
    );

    if (existingItem) {
        const totalAmount = existingItem.amount + harvestedAmount;
        const newQuality = ((existingItem.quality * existingItem.amount) + (quality * harvestedAmount)) / totalAmount;

        existingItem.amount = totalAmount;
        existingItem.quality = newQuality.toFixed(2);
    } else {
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
    }

    saveInventory();
    addConsoleMessage(`Harvested ${formatNumber(harvestedAmount)} kg of ${farmland.plantedResourceName} with quality ${quality} from ${farmland.name}`);
}

export function harvest(farmland, farmlandId, selectedTool, totalHarvest) {
    const buildings = loadBuildings();
    const resourceObj = allResources.find(r => r.name === farmland.plantedResourceName);
    
    const tool = buildings.flatMap(b => b.tools).find(t => 
        `${t.name} #${t.instanceNumber}` === selectedTool
    );

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

    const taskName = `Harvesting`;
    const densityPenalty = Math.max(0, (farmland.density - 1000) / 1000) * 0.05;
    const fragilePenalty = (1 - resourceObj.fragile) * 0.5; 
    const [minAltitude, maxAltitude] = regionAltitudeRanges[farmland.country][farmland.region];
    const medianAltitude = (minAltitude + maxAltitude) / 2;
    const altitudeDeviation = (farmland.altitude - medianAltitude) / (maxAltitude - minAltitude);
    const altitudePenalty = altitudeDeviation * 0.5; 
    const totalWork = totalHarvest / 1000 * 25 * (1 + densityPenalty + altitudePenalty + fragilePenalty); 

    addConsoleMessage(`Work calculation for harvesting ${getFlagIconHTML(farmland.country)} ${farmland.name}:
    - Base work units: ${formatNumber(totalHarvest / 1000 * 25, 1)} (${formatNumber(totalHarvest)} kg ÷ 1000 × 25)
    - Density penalty: +${formatNumber(densityPenalty * 100, 1)}%
    - Altitude penalty: ${formatNumber(altitudeDeviation * 100, 1)}% (${altitudePenalty >= 0 ? '+' : '-'}${formatNumber(Math.abs(altitudePenalty * 100), 1)}% work)
    - Fragility penalty: +${formatNumber(fragilePenalty * 100, 1)}% (${resourceObj.name} fragility: ${resourceObj.fragile})
    - Final work units: ${formatNumber(totalWork, 1)}`);

    taskManager.addProgressiveTask(
        taskName,
        TaskType.field,
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

                    row.querySelector('.storage-checkbox').addEventListener('change', function() {
                        updateSelectedCapacity(farmland);
                    });
                }
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
        let totalAvailableCapacity = 0;
        let harvestWarning = false;

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
            showWarningModal(farmland, farmlandId, selectedCheckboxes, totalAvailableCapacity, expectedYield, overlayContainer);
        } else {
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
    ;
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