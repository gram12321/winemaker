import { farmlandYield } from '../../farmland.js';
import { showFarmlandOverlay } from '../farmlandOverlay.js';
import { showHarvestOverlay } from '../harvestOverlay.js';
import { showResourceInfoOverlay } from '../resourceInfoOverlay.js';
import { formatNumber, getColorClass } from '../../utils.js';
import { loadFarmlands } from '../../database/adminFunctions.js';

/**
 * Creates and displays the vineyard management overlay
 * Shows a table of all farmlands with their current status, crops, and actions
 */
export function showVineyardOverlay() {
    const overlay = showMainViewOverlay(getVineyardOverlayHTML());
    
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
        </div>
    `;
}

export function createVineyardTable() {
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
                <th>Expected Yield</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${farmlands.map(farmland => {
                const canHarvest = farmland.plantedResourceName && farmland.ripeness >= 0.10;
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
                        <td>${farmlandYield(farmland) >= 1000 ? formatNumber(farmlandYield(farmland)/1000, 2) + ' t' : formatNumber(farmlandYield(farmland), 2) + ' kg'}</td>
                        <td>
                            <button class="btn btn-alternative btn-sm harvest-btn" 
                                    data-farmland-id="${farmland.id}"
                                    ${!canHarvest ? 'disabled' : ''}>
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