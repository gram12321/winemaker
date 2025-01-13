import { getBuildingTools } from '../buildings.js';
import { addConsoleMessage } from '../console.js';
import { showVineyardOverlay } from './mainpages/vineyardoverlay.js';
import { inventoryInstance } from '../resource.js';
import { farmlandYield, canHarvest } from '../vineyard.js';
import { formatNumber } from '../utils.js';
import { saveInventory, updateFarmland } from '../database/adminFunctions.js';

/**
 * Handles the harvesting of grapes from a farmland
 * @param {Object} farmland - The farmland to harvest from
 * @param {number} farmlandId - ID of the farmland
 * @param {string} selectedTool - The storage container identifier
 * @param {number|null} availableCapacity - Optional capacity limit for partial harvests
 * @returns {boolean} True if harvest successful, false otherwise
 */
function harvest(farmland, farmlandId, selectedTool, availableCapacity = null) {
    // Check if harvesting is possible with selected storage
    const harvestCheck = canHarvest(farmland, selectedTool);
    if ((!harvestCheck || harvestCheck.warning) && !availableCapacity) {
        return false;
    }

    const buildings = JSON.parse(localStorage.getItem('buildings')) || [];
    const tool = buildings.flatMap(b => b.tools).find(t => 
        `${t.name} #${t.instanceNumber}` === selectedTool
    );

    if (!tool) {
        addConsoleMessage("Storage container not found");
        return false;
    }

    const gameYear = parseInt(localStorage.getItem('year'), 10);
    const harvestYield = farmlandYield(farmland);
    const currentInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
    const currentAmount = currentInventory
        .filter(item => item.storage === selectedTool)
        .reduce((sum, item) => sum + item.amount, 0);

    const remainingCapacity = tool.capacity - currentAmount;
    const totalHarvest = availableCapacity || Math.min(harvestYield, remainingCapacity);
    const quality = ((farmland.annualQualityFactor + farmland.ripeness) / 2).toFixed(2);

    // Add harvested grapes to inventory using inventoryInstance
    inventoryInstance.addResource(
        { name: farmland.plantedResourceName, naturalYield: 1 },
        totalHarvest,
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
    addConsoleMessage(`Harvested ${formatNumber(totalHarvest)} kg of ${farmland.plantedResourceName} with quality ${quality} from ${farmland.name}`);
    return true;
}

export function showHarvestOverlay(farmland, farmlandId) {
    const overlayContainer = document.createElement('div');
    overlayContainer.className = 'overlay';

    overlayContainer.innerHTML = `
        <div class="overlay-content">
            <h2>Harvest Options for ${farmland.name}</h2>
            <div class="form-group">
                <label for="storage-select" class="form-label">Select Storage Container:</label>
                <div class="storage-grid" id="storage-display-body">
                </div>
            </div>
            <div class="harvest-details d-flex justify-content-between">
                <div class="harvest-overlay-info-box">
                    <span>Expected Yield: </span><span id="expected-yield">${formatNumber(farmlandYield(farmland))} kg</span>
                </div>
                <div class="harvest-overlay-info-box">
                    <span>Quality: </span><span id="expected-quality">${((farmland.annualQualityFactor + farmland.ripeness) / 2).toFixed(2)}</span>
                </div>
                <div class="harvest-overlay-info-box">
                    <span>Status: </span><span id="field-status">${farmland.status}</span>
                </div>
            </div>
            <button class="btn btn-primary harvest-btn">Harvest</button>
            <button class="btn btn-secondary close-btn">Close</button>
        </div>
    `;

    document.body.appendChild(overlayContainer);

    // Populate storage options
    const storageBody = document.getElementById('storage-display-body');
    const buildings = JSON.parse(localStorage.getItem('buildings')) || [];
    const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];

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
                    const firstItem = matchingInventoryItems[0];

                    const containerDiv = document.createElement('div');
                    containerDiv.className = 'storage-container';
                    containerDiv.innerHTML = `
                        <div class="storage-header">
                            <input type="radio" name="tool-select" value="${toolId}" id="${toolId}">
                            <label for="${toolId}">${tool.name}</label>
                        </div>
                        <div class="storage-stats">
                            <div>Capacity: ${formatNumber(tool.capacity)} kg</div>
                            <div>Available: ${formatNumber(tool.capacity - currentAmount)} kg</div>
                            ${firstItem ? 
                                `<div>Current: ${firstItem.fieldName}</div>
                                 <div>${firstItem.resource.name}, ${firstItem.vintage}</div>` 
                                : '<div>Empty</div>'
                            }
                        </div>
                    `;
                    storageBody.appendChild(containerDiv);
                }
            });
        }
    });

    // Handle harvest button click
    overlayContainer.querySelector('.harvest-btn').addEventListener('click', () => {
        const selectedRadio = overlayContainer.querySelector('input[name="tool-select"]:checked');
        if (!selectedRadio) {
            addConsoleMessage('Please select a storage container for harvesting');
            return;
        }

        const harvestCheck = canHarvest(farmland, selectedRadio.value);
        if (harvestCheck.warning) {
            const expectedYield = farmlandYield(farmland);
            const warningModal = document.createElement('div');
            warningModal.className = 'modal fade';
            warningModal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Warning: Limited Container Capacity</h5>
                            <button type="button" class="close" data-dismiss="modal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <p>Container only has capacity for ${formatNumber(harvestCheck.availableCapacity)}kg out of expected ${formatNumber(expectedYield)}kg.</p>
                            <p>Do you want to harvest what fits in the container?</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="confirmHarvest">Harvest Available</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(warningModal);
            $(warningModal).modal('show');

            document.getElementById('confirmHarvest').addEventListener('click', () => {
                if (harvest(farmland, farmlandId, selectedRadio.value, harvestCheck.availableCapacity)) {
                    $(warningModal).modal('hide');
                    warningModal.remove();
                    removeOverlay();
                }
            });

            warningModal.addEventListener('hidden.bs.modal', () => {
                warningModal.remove();
            });
        } else if (harvestCheck.warning === false) {
            if (harvest(farmland, farmlandId, selectedRadio.value)) {
                removeOverlay();
            }
        }
    });

    const closeButton = overlayContainer.querySelector('.close-btn');
    closeButton.addEventListener('click', removeOverlay);
    overlayContainer.addEventListener('click', (event) => {
        if (event.target === overlayContainer) removeOverlay();
    });

    function removeOverlay() {
        document.body.removeChild(overlayContainer);
        // Update vineyard overlay to reflect changes
        const vineyardOverlay = document.querySelector('.mainview-overlay');
        if (vineyardOverlay) {
            showVineyardOverlay();
        }
    }
}