import { showBuyLandOverlay } from '/js/overlays/buyLandOverlay.js';
import { getUnit, convertToCurrentUnit } from '/js/settings.js';
import { getFlagIcon, formatNumber } from '/js/utils.js';
import { loadFarmlands } from '/js/database/adminFunctions.js';
import taskManager from '/js/taskManager.js';
import { showFarmlandOverlay } from '/js/overlays/farmlandOverlay.js';
import { showPlantingOverlay } from '/js/overlays/plantingOverlay.js';
import { showResourceInfoOverlay } from '/js/overlays/resourceInfoOverlay.js';
import { showMainViewOverlay } from '../overlayUtils.js';

export function showLandOverlay() {
    const overlay = showMainViewOverlay(createLandOverlayHTML());
    setupLandEventListeners(overlay);
    displayFarmland();
}

function createLandOverlayHTML() {
    return `
        <div class="mainview-overlay-content overlay-container">
            <h2 class="mb-4">Farmland Management</h2>
            <section id="vineyard-section" class="overlay-section card mb-4">
                <img src="/assets/pic/farming_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Farming">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Owned Farmland</h3>
                    <button id="buy-land-btn" class="btn btn-light btn-sm">Buy Land</button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover overlay-table">
                            <thead>
                                <tr>
                                    <th>Farmland</th>
                                    <th>Field Name</th>
                                    <th>Country/Region</th>
                                    <th>Size</th>
                                    <th>Crop</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="farmland-entries">
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
            <div id="buyLandOverlay" class="overlay" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5);">
                <div id="farmland-table-container" style="position: relative; top: 50%; transform: translateY(-50%);"></div>
            </div>
            <div id="farmlandOverlay" class="overlay" style="display: none;">
                <div class="overlay-content text-center">
                    <div id="farmland-details"></div>
                </div>
            </div>
        </div>
    `;
}

function setupLandEventListeners(overlay) {
    // Buy land button listener
    const buyLandBtn = overlay.querySelector('#buy-land-btn');
    if (buyLandBtn) {
        buyLandBtn.addEventListener('click', showBuyLandOverlay);
    }

    // Farmland row listeners
    const farmlandEntries = overlay.querySelector('#farmland-entries');
    if (farmlandEntries) {
        const rows = farmlandEntries.querySelectorAll('tr');
        rows.forEach(row => {
            const plantBtn = row.querySelector('.plant-btn');
            const farmlandCells = row.querySelectorAll('td:not(:last-child):not(.crop-column)');
            const cropColumn = row.querySelector('.crop-column');
            const farmlandId = plantBtn?.dataset.farmlandId;
            const farmland = farmlandId ? loadFarmlands().find(f => f.id === parseInt(farmlandId)) : null;

            if (plantBtn && farmland) {
                plantBtn.addEventListener('click', () => {
                    showPlantingOverlay(farmland, () => displayFarmland());
                });
            }

            if (cropColumn && farmland) {
                cropColumn.addEventListener('click', (event) => {
                    event.stopPropagation();
                    if (farmland.plantedResourceName) {
                        showResourceInfoOverlay(farmland.plantedResourceName);
                    }
                });
            }

            farmlandCells.forEach(cell => {
                if (farmland) {
                    cell.addEventListener('click', () => {
                        showFarmlandOverlay(farmland);
                    });
                }
            });
        });
    }
}

export function displayFarmland() {
    const farmlandEntries = document.querySelector('#farmland-entries');
    if (!farmlandEntries) return;
    
    farmlandEntries.innerHTML = '';
    const farmlands = loadFarmlands();
    const selectedUnit = getUnit();

    farmlands.forEach((farmland) => {
        const row = createFarmlandRow(farmland, selectedUnit);
        farmlandEntries.appendChild(row);
    });
    
    // Setup event listeners after all rows are added
    const overlay = document.querySelector('.mainview-overlay');
    if (overlay) {
        setupLandEventListeners(overlay);
    }
}

function createFarmlandRow(farmland, selectedUnit) {
    const landSize = convertToCurrentUnit(farmland.acres);
    const row = document.createElement('tr');
    
    const isPlantingAllowed = !farmland.plantedResourceName && 
                             !taskManager.isTargetBusy(farmland) &&
                             farmland.status !== 'Planting...';
    
    const formattedSize = landSize < 10 ? landSize.toFixed(2) : formatNumber(landSize);
    
    row.innerHTML = `
        <td><img src="/assets/pic/vineyard_dalle.webp" alt="Vineyard Image" style="width: 80px; height: auto; border-radius: 8px;"></td>
        <td>${farmland.name}</td>
        <td>
          ${getFlagIcon(farmland.country)}
          ${farmland.country}, ${farmland.region}
        </td>
        <td>${formattedSize} ${selectedUnit}</td>
        <td class="crop-column">${farmland.plantedResourceName || 'None'}</td>
        <td>
          <button class="btn btn-alternative btn-sm plant-btn" data-farmland-id="${farmland.id}" ${!isPlantingAllowed ? 'disabled' : ''}>
            ${taskManager.isTargetBusy(farmland) ? 'In Progress' : 'Plant'}
          </button>
        </td>
    `;
    return row;
}

function setupFarmlandEventListeners(row, farmland) {
    const plantBtn = row.querySelector('.plant-btn');
    const farmlandCells = row.querySelectorAll('td:not(:last-child):not(.crop-column)');
    const cropColumn = row.querySelector('.crop-column');

    plantBtn.addEventListener('click', () => {
        showPlantingOverlay(farmland, () => displayFarmland());
    });

    cropColumn.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the row click event
        if (farmland.plantedResourceName) {
            showResourceInfoOverlay(farmland.plantedResourceName);
        }
    });

    farmlandCells.forEach(cell => {
        cell.addEventListener('click', () => {
            showFarmlandOverlay(farmland);
        });
    });
}

