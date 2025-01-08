
import { getBuildingTools } from '../buildings.js';
import { addConsoleMessage } from '../console.js';
import { farmlandYield, canHarvest } from '../vineyard.js';
import { formatNumber } from '../utils.js';
import { saveInventory } from '../database/adminFunctions.js';

function harvest(farmland, farmlandId, selectedTool, availableCapacity = null) {
    const harvestCheck = canHarvest(farmland, selectedTool);
    if ((!harvestCheck || harvestCheck.warning) && !availableCapacity) {
        return false;
    }

    const buildings = JSON.parse(localStorage.getItem('buildings')) || [];
    const tool = buildings.flatMap(b => b.contents).find(t => 
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

    // Add harvested grapes to inventory
    const newInventory = [...currentInventory, {
        resource: { name: farmland.plantedResourceName },
        amount: totalHarvest,
        state: 'Grapes',
        vintage: gameYear,
        quality: quality,
        fieldName: farmland.name,
        fieldPrestige: farmland.farmlandPrestige,
        storage: selectedTool
    }];
    
    localStorage.setItem('playerInventory', JSON.stringify(newInventory));

    // Update farmland status
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const farmlandToUpdate = farmlands.find(f => f.id === parseInt(farmlandId));
    if (farmlandToUpdate) {
        farmlandToUpdate.ripeness = 0;
        farmlandToUpdate.status = 'Harvested';
        localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
    }

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
            <table class="table table-bordered">
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
            <button class="btn btn-success harvest-btn">Harvest</button>
            <button class="btn btn-secondary close-btn">Close</button>
        </div>
    `;

    document.body.appendChild(overlayContainer);

    // Populate storage options
    const storageBody = document.getElementById('storage-display-body');
    const buildings = JSON.parse(localStorage.getItem('buildings')) || [];
    const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];

    buildings.forEach(building => {
        building.contents.forEach(tool => {
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
                    <td><input type="radio" name="tool-select" value="${toolId}"></td>
                    <td>${toolId}</td>
                    <td>${tool.capacity}</td>
                    <td>${firstItem ? `${firstItem.fieldName}, ${firstItem.resource.name}, ${firstItem.vintage}` : 'Empty'}</td>
                    <td>${formatNumber(currentAmount)} kg</td>
                `;
                storageBody.appendChild(row);
            }
        });
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
    }
}
