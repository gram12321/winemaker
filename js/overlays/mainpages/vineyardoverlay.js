import { farmlandYield } from '../../farmland.js';
import { showFarmlandOverlay } from '../farmlandOverlay.js';
import { showHarvestOverlay } from '../harvestOverlay.js';
import { showResourceInfoOverlay } from '../resourceInfoOverlay.js';
import { formatNumber } from '../../utils.js';
import { loadFarmlands } from '../../database/adminFunctions.js';

/**
 * Creates and displays the vineyard management overlay
 * Shows a table of all farmlands with their current status, crops, and actions
 */
export function showVineyardOverlay() {
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    overlay.innerHTML = getVineyardOverlayHTML();

    document.body.appendChild(overlay);

    const container = document.getElementById('vineyard-table-container');
    const table = createVineyardTable();
    container.appendChild(table);

    setupVineyardEventListeners(table);

    overlay.style.display = 'block';
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
                <th>Expected Yield</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${farmlands.map(farmland => {
                const canHarvest = farmland.plantedResourceName && farmland.ripeness >= 0.10;
                const formattedSize = farmland.acres < 10 ? farmland.acres.toFixed(2) : formatNumber(farmland.acres);
                return `
                    <tr data-farmland-id="${farmland.id}">
                        <td>${farmland.name}</td>
                        <td>${formattedSize} acres</td>
                        <td>${farmland.plantedResourceName ? farmland.vineAge : 'Not Planted'}</td>
                        <td class="crop-column">${farmland.plantedResourceName || 'None'}</td>
                        <td>${farmland.status}</td>
                        <td>${farmland.plantedResourceName ? (farmland.ripeness * 100).toFixed(1) + '%' : 'Not Planted'}</td>
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

function setupVineyardEventListeners(table) {
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