import { farmlandYield, getRemainingYield } from '../../farmland.js';
import { showFarmlandOverlay } from '../farmlandOverlay.js';
import { showHarvestOverlay } from '../harvestOverlay.js';
import { showResourceInfoOverlay } from '../resourceInfoOverlay.js';
import { formatNumber, getColorClass } from '../../utils.js';
import { loadFarmlands, loadBuildings } from '../../database/adminFunctions.js';
import { showMainViewOverlay } from '/js/overlays/overlayUtils.js';
import { inventoryInstance } from '../../resource.js';
import taskManager from '../../taskManager.js';



export function showVineyardOverlay() {
    const overlay = showMainViewOverlay(getVineyardOverlayHTML());
    
    if (tutorialManager.shouldShowTutorial('VINEYARD')) {
        tutorialManager.showTutorial('VINEYARD');
    }
    
    const container = overlay.querySelector('#vineyard-table-container');
    const table = createVineyardTable();
    container.appendChild(table);

    setupVineyardEventListeners(table);
}

function getVineyardOverlayHTML() {
    return `
        <div class="mainview-overlay-content overlay-container">
            <h2 class="mb-4">Vineyard Management</h2>
            <div class="overlay-sections">
                <section id="vineyard-section" class="overlay-section card mb-4">
                    <img src="/assets/pic/vineyard_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Vineyard">
                    <div class="card-header text-white d-flex justify-content-between align-items-center">
                        <h3 class="h5 mb-0">Vineyard Fields</h3>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <div id="vineyard-table-container"></div>
                        </div>
                    </div>
                </section>
            </div>
            <div id="farmlandOverlay" class="overlay" style="display: none;">
                <div class="overlay-content">
                    <div id="farmland-details"></div>
                </div>
            </div>
            <div id="resourceInfoOverlay" class="overlay" style="display: none;">
                <div class="overlay-content">
                    <div id="resource-details"></div>
                </div>
            </div>
        </div>
    `;
}

export function updateVineyardTable() {
    const container = document.getElementById('vineyard-table-container');
    if (!container) return;
    
    container.innerHTML = '';
    const table = createVineyardTable();
    container.appendChild(table);
    setupVineyardEventListeners(table);
}

export function canHarvest(farmland, selectedTool) {
    // Basic checks first
    if (farmland.status === 'No yield in first season' || taskManager.isTargetBusy(farmland)) {
        return false;
    }

    // If no selectedTool is provided, just check if harvesting is possible
    if (!selectedTool) {
        return farmland.plantedResourceName && 
               farmland.ripeness >= 0.10 && 
               getRemainingYield(farmland) > 0;
    }

    // Tool-specific checks
    const buildings = loadBuildings();
    const tool = buildings.flatMap(b => 
        b.slots.flatMap(slot => 
            slot.tools.find(t => `${t.name} #${t.instanceNumber}` === selectedTool)
        )
    ).find(t => t);

    if (!tool) {
        return { warning: true, availableCapacity: 0 };
    }

    // Check container capacity
    const currentAmount = inventoryInstance.items
        .filter(item => item.storage === selectedTool)
        .reduce((sum, item) => sum + item.amount, 0);
    const availableCapacity = tool.capacity - currentAmount;

    // Check for mixing different grapes
    const existingGrapes = inventoryInstance.items.find(item => 
        item.storage === selectedTool && 
        item.state === 'Grapes' &&
        (item.resource.name !== farmland.plantedResourceName || 
         parseInt(item.vintage) !== parseInt(localStorage.getItem('year')))
    );

    return {
        warning: existingGrapes !== undefined || availableCapacity <= 0,
        availableCapacity: availableCapacity > 0 ? availableCapacity : 0
    };
}

function createVineyardTable() {
    const farmlands = loadFarmlands();
    const table = document.createElement('table');
    table.className = 'table table-hover overlay-table';

    table.innerHTML = `
        <thead>
            <tr>
                <th>Field Name</th>
                <th>Size</th>
                <th>Vine Age</th>
                <th>Crop</th>
                <th>Status</th>
                <th>Ripeness</th>
                <th>Remaining Yield</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${farmlands.map(farmland => {
                const totalYield = farmlandYield(farmland);
                const remainingYield = getRemainingYield(farmland);
                const isFarmlandBusy = taskManager.isTargetBusy(farmland);
                
                const canHarvest = farmland.plantedResourceName && 
                                 farmland.ripeness >= 0.10 && 
                                 remainingYield > 0 &&
                                 !isFarmlandBusy;

                const formattedSize = farmland.acres < 10 ? farmland.acres.toFixed(2) : formatNumber(farmland.acres);
                const ripenessColorClass = getColorClass(farmland.ripeness);
                return `
                    <tr data-farmland-id="${farmland.id}">
                        <td>${farmland.name}</td>
                        <td>${formattedSize} acres</td>
                        <td>${farmland.plantedResourceName ? farmland.vineAge : 'Not Planted'}</td>
                        <td class="crop-column">${farmland.plantedResourceName || 'None'}</td>
                        <td>${farmland.status}</td>
                        <td class="${ripenessColorClass}">${farmland.plantedResourceName ? formatNumber(farmland.ripeness * 100, 0) + '%' : 'Not Planted'}</td>
                        <td>${remainingYield >= 1000 ? 
                            formatNumber(remainingYield/1000, 2) + ' t' : 
                            formatNumber(remainingYield, 2) + ' kg'}
                            ${remainingYield !== totalYield ? 
                                `<small class="text-muted">(of ${formatNumber(totalYield/1000, 2)} t)</small>` : 
                                ''}
                        </td>
                        <td>
                            <button class="btn btn-alternative btn-sm harvest-btn" 
                                    data-farmland-id="${farmland.id}"
                                    ${!canHarvest ? 'disabled' : ''}
                                    title="${!canHarvest && isFarmlandBusy ? 'Field is busy with another task' : ''}">
                                Harvest
                            </button>
                        </td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;

    return table;
}

export function setupVineyardEventListeners(table) {
    const farmlands = loadFarmlands();
    const rows = table.querySelectorAll('tr[data-farmland-id]');
    rows.forEach(row => {
        const cropColumn = row.querySelector('.crop-column');
        cropColumn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the row click event
            const farmlandId = row.dataset.farmlandId;
            const farmland = farmlands.find(f => f.id === parseInt(farmlandId));
            if (farmland && farmland.plantedResourceName) {
                showResourceInfoOverlay(farmland.plantedResourceName);
            }
        });

        row.addEventListener('click', (e) => {
            if (!e.target.classList.contains('harvest-btn') && !e.target.classList.contains('crop-column')) {
                const farmlandId = row.dataset.farmlandId;
                const farmland = farmlands.find(f => f.id === parseInt(farmlandId));
                if (farmland) {
                    showFarmlandOverlay(farmland);
                }
            }
        });

        const harvestBtn = row.querySelector('.harvest-btn');
        if (harvestBtn) {
            harvestBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const farmlandId = harvestBtn.dataset.farmlandId;
                const farmland = farmlands.find(f => f.id === parseInt(farmlandId));
                if (farmland) {
                    showHarvestOverlay(farmland, farmlandId);
                }
            });
        }
    });
}