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

function showWarningModal(farmland, farmlandId, selectedTools, totalAvailableCapacity, expectedYield, overlayContainer) {
    console.log('[showWarningModal] Showing warning:', {
        farmland,
        farmlandId,
        selectedTools,
        totalAvailableCapacity,
        expectedYield
    });

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
    console.log('[performHarvest] Starting harvest:', {
        farmland,
        farmlandId,
        selectedTools,
        harvestedAmount,
        selectedToolsType: typeof selectedTools,
        isArray: Array.isArray(selectedTools)
    });

    // Ensure selectedTools is always an array of strings
    const toolsArray = Array.isArray(selectedTools) ? 
        selectedTools.map(t => t.toString()) : 
        [];
    
    if (harvestedAmount <= 0) {
        console.warn('No harvest amount specified');
        return false;
    }

    if (toolsArray.length === 0) {
        console.warn('No tools selected for harvest');
        return false;
    }

    // Get available capacity for all selected tools
    const buildings = loadBuildings();
    let remainingHarvest = harvestedAmount;
    let totalStoredAmount = 0;

    // Calculate quality factors once to ensure consistency
    const gameYear = parseInt(localStorage.getItem('year'), 10);
    const suitability = grapeSuitability[farmland.country]?.[farmland.region]?.[farmland.plantedResourceName] || 0.5;
    const farmlands = loadFarmlands();
    const currentFarmland = farmlands.find(f => f.id === parseInt(farmlandId));
    
    if (!currentFarmland) {
        console.error('Farmland not found:', farmlandId);
        return false;
    }

    const quality = ((farmland.annualQualityFactor + currentFarmland.ripeness + suitability) / 3).toFixed(2);

    console.log('[performHarvest] Quality calculation:', {
        quality,
        annualQualityFactor: farmland.annualQualityFactor,
        ripeness: currentFarmland.ripeness,
        suitability
    });

    // Process each tool in sequence
    for (const selectedTool of toolsArray) {
        if (remainingHarvest <= 0) break;

        console.log('[performHarvest] Processing tool:', selectedTool);

        // Find the actual tool object
        const tool = buildings.flatMap(b => 
            b.slots.flatMap(slot => 
                slot.tools.find(t => t.getStorageId() === selectedTool)
            )
        ).find(t => t);

        if (!tool) {
            console.warn('Tool not found:', selectedTool);
            continue;
        }

        // Calculate available capacity for this tool
        const currentAmount = inventoryInstance.items
            .filter(item => item.storage === selectedTool)
            .reduce((sum, item) => sum + item.amount, 0);
        const availableCapacity = tool.capacity - currentAmount;

        console.log('[performHarvest] Tool capacity check:', {
            tool: selectedTool,
            capacity: tool.capacity,
            currentAmount,
            availableCapacity
        });

        if (availableCapacity <= 0) {
            console.warn('No capacity available in tool:', selectedTool);
            continue;
        }

        // Calculate how much to store in this tool
        const amountForTool = Math.min(remainingHarvest, availableCapacity);

        try {
            // Find matching grapes for this tool
            const matchingGrapes = inventoryInstance.items.find(item =>
                item.storage === selectedTool && 
                item.state === 'Grapes' &&
                item.resource.name === farmland.plantedResourceName &&
                item.vintage === gameYear
            );

            console.log('[performHarvest] Adding to inventory:', {
                tool: selectedTool,
                amount: amountForTool,
                existing: matchingGrapes ? matchingGrapes.amount : 0
            });

            if (matchingGrapes) {
                // Combine with existing grapes
                const totalAmount = matchingGrapes.amount + amountForTool;
                const newQuality = ((matchingGrapes.quality * matchingGrapes.amount) + (quality * amountForTool)) / totalAmount;
                matchingGrapes.amount = totalAmount;
                matchingGrapes.quality = newQuality.toFixed(2);
            } else {
                // Create new inventory entry
                inventoryInstance.addResource(
                    { name: farmland.plantedResourceName, naturalYield: 1 },
                    amountForTool,
                    'Grapes',
                    gameYear,
                    quality,
                    farmland.name,
                    farmland.farmlandPrestige,
                    selectedTool
                );
            }

            totalStoredAmount += amountForTool;
            remainingHarvest -= amountForTool;
            
            addConsoleMessage(`Harvested ${formatNumber(amountForTool)} kg of ${farmland.plantedResourceName} with quality ${quality} from ${farmland.name} to ${selectedTool}`);
        } catch (error) {
            console.error('Error storing harvest in inventory:', error);
            console.error(error.stack);
        }
    }

    if (totalStoredAmount > 0) {
        saveInventory();
        console.log('[performHarvest] Successfully stored total:', totalStoredAmount);
        return true;
    }

    console.warn('[performHarvest] No grapes were stored');
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
    console.log('[harvest] Initiating harvest for field:', {
        farmland,
        currentRemainingYield: farmland.remainingYield,
        requestedHarvest: totalHarvest,
        selectedTools,
        selectedToolsType: typeof selectedTools,
        isArray: Array.isArray(selectedTools)
    });

    try {
        // Ensure selectedTools is always an array of strings
        const toolsArray = Array.isArray(selectedTools) ? 
            selectedTools.map(t => t.toString()) : 
            [];
        
        if (toolsArray.length === 0) {
            console.error('No tools provided for harvest');
            return false;
        }

        const buildings = loadBuildings();
        const resourceObj = allResources.find(r => r.name === farmland.plantedResourceName);
        
        // Check compatibility for all selected tools
        for (const toolId of toolsArray) {
            const compatibility = checkGrapeCompatibility(toolId, farmland);
            if (!compatibility.compatible) {
                addConsoleMessage(compatibility.message);
                return false;
            }
        }

        const taskName = 'Harvesting';
        const densityPenalty = Math.max(0, (farmland.density - 1000) / 1000) * 0.05;
        const fragilePenalty = (1 - resourceObj.fragile) * 0.5;
        const [minAltitude, maxAltitude] = regionAltitudeRanges[farmland.country][farmland.region];
        const medianAltitude = (minAltitude + maxAltitude) / 2;
        const altitudeDeviation = (farmland.altitude - medianAltitude) / (maxAltitude - minAltitude);
        const altitudePenalty = altitudeDeviation * 0.5;
        const totalWork = totalHarvest / 1000 * 25 * (1 + densityPenalty + altitudePenalty + fragilePenalty);

        taskManager.addProgressiveTask(
            taskName,
            'field',
            totalWork,
            (target, progress, params) => {
                // Initialize remaining yield if null
                if (target.remainingYield === null) {
                    target.remainingYield = farmlandYield(target);
                }

                // Initialize lastProgress if undefined
                if (params.lastProgress === undefined) {
                    params.lastProgress = 0;
                }

                // Calculate harvest amount based on progress increment
                const progressIncrement = progress - params.lastProgress;
                const harvestedAmount = Math.min(
                    target.remainingYield,
                    totalHarvest * progressIncrement
                );
                
                console.log('[harvest:callback] Processing harvest increment:', {
                    progress,
                    progressIncrement,
                    harvestedAmount,
                    remainingBefore: target.remainingYield,
                    remainingAfter: target.remainingYield - harvestedAmount,
                    tools: params.selectedTools
                });

                if (harvestedAmount > 0) {
                    params.lastProgress = progress;
                    target.remainingYield -= harvestedAmount;
                    
                    performHarvest(target, farmlandId, toolsArray, harvestedAmount);
                    
                    updateFarmland(farmlandId, {
                        remainingYield: target.remainingYield,
                        status: target.remainingYield <= 0 ? 'Harvested' : 'Partially Harvested',
                        ripeness: target.remainingYield <= 0 ? 0 : target.ripeness
                    });
                }
            },
            farmland,
            {
                selectedTools: toolsArray, // Store as array of strings
                totalHarvest,
                lastProgress: 0
            }
        );

        return true;
    } catch (error) {
        console.error('[harvest] Error during harvest initiation:', error);
        throw error;
    }
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

    // Get all selected tools and their capacities
    const selectedTools = Array.from(selectedCheckboxes).map(checkbox => checkbox.value);
    let totalAvailableCapacity = Array.from(selectedCheckboxes).reduce((total, checkbox) => {
        const harvestCheck = canHarvest(farmland, checkbox.value);
        return total + harvestCheck.availableCapacity;
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