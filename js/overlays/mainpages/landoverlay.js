import { showBuyLandOverlay } from '/js/overlays/buyLandOverlay.js';
import { getUnit, convertToCurrentUnit } from '/js/settings.js';
import { getFlagIcon, formatNumber,getColorClass  } from '/js/utils.js';
import { loadFarmlands } from '/js/database/adminFunctions.js';
import taskManager from '/js/taskManager.js';
import { showFarmlandOverlay } from '/js/overlays/farmlandOverlay.js';
import { showPlantingOverlay } from '/js/overlays/plantingOverlay.js';
import { showResourceInfoOverlay } from '/js/overlays/resourceInfoOverlay.js';
import { showMainViewOverlay } from '../overlayUtils.js';
import { showClearingOverlay } from '../clearingOverlay.js';
import { showUprootOverlay } from '../uprootOverlay.js';  // Add this import

export function showLandOverlay() {
    const overlay = showMainViewOverlay(createLandOverlayHTML());
    
    // Add tutorial check
    if (tutorialManager.shouldShowTutorial('FARMLAND')) {
        tutorialManager.showTutorial('FARMLAND');
    }
    
    setupLandEventListeners(overlay);
    displayFarmland();
}

function setupLandEventListeners(overlay) {
    const buyLandBtn = overlay.querySelector('#buy-land-btn');
    if (buyLandBtn) {
        buyLandBtn.addEventListener('click', showBuyLandOverlay);
    }
}

function createLandOverlayHTML() {
    return `
        <div id="farmland-container" class="mainview-overlay-content overlay-container">
            <h2 id="farmland-title" class="mb-4">Farmland Management</h2>
            <section id="landoverlay-section" class="overlay-section card mb-4">
                <img id="farmland-header-img" src="/assets/pic/farming_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Farming">
                <div id="farmland-header" class="card-header text-white d-flex justify-content-between align-items-center">
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
                                    <th>Prestige</th>
                                    <th>Health</th>
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
        </div>
    `;
}

export function displayFarmland() {
    const farmlandEntries = document.querySelector('#farmland-entries');
    if (!farmlandEntries) return;
    
    farmlandEntries.innerHTML = '';
    const farmlands = loadFarmlands();
    const selectedUnit = getUnit();

    farmlands.forEach((farmland) => {
        const row = createFarmlandRow(farmland, selectedUnit);
        setupFarmlandEventListeners(row, farmland);
        farmlandEntries.appendChild(row);
    });
}

function createFarmlandRow(farmland, selectedUnit) {
    const landSize = convertToCurrentUnit(farmland.acres);
    const row = document.createElement('tr');
    
    const isPlantingAllowed = !farmland.plantedResourceName && 
                             !taskManager.isTargetBusy(farmland) &&
                             farmland.status !== 'Planting...';
    
    const isClearingAllowed = !taskManager.isTargetBusy(farmland) &&
                             farmland.canBeCleared === 'Ready to be cleared' && // Only allow clearing if the farmland is ready IE After clearing there needs to be planted before clearing again
                             (!farmland.plantedResourceName || (farmland.plantedResourceName && farmland.vineAge > 0)); // No clearing first season after planting
    
    const isUprootAllowed = !taskManager.isTargetBusy(farmland) && 
                           farmland.plantedResourceName && 
                           farmland.status !== 'Planting...';
    
    const formattedSize = landSize < 10 ? landSize.toFixed(2) : formatNumber(landSize);
    const prestigeColorClass = getColorClass(farmland.farmlandPrestige || 0);
    const healthColorClass = getColorClass(farmland.farmlandHealth || 0);
    
    row.innerHTML = `
        <td><img src="/assets/pic/vineyard_dalle.webp" alt="Vineyard Image" style="width: 80px; height: auto; border-radius: 8px;"></td>
        <td>${farmland.name}</td>
        <td>
          ${getFlagIcon(farmland.country)}
          ${farmland.country}, ${farmland.region}
        </td>
        <td>${formattedSize} ${selectedUnit}</td>
        <td class="crop-column">${farmland.plantedResourceName || 'None'}</td>
        <td class="${prestigeColorClass}">${formatNumber((farmland.farmlandPrestige || 0) * 100)}%</td>
        <td class="${healthColorClass}">${formatNumber((farmland.farmlandHealth || 0) * 100)}%</td>
        <td>
          <button class="btn btn-alternative btn-sm plant-btn" data-farmland-id="${farmland.id}" ${!isPlantingAllowed ? 'disabled' : ''}>
            ${taskManager.isTargetBusy(farmland) ? 'In Progress' : 'Plant'}
          </button>
          <button class="btn btn-warning btn-sm clear-btn" data-farmland-id="${farmland.id}" ${!isClearingAllowed ? 'disabled' : ''}>
            Clear
          </button>
          <button class="btn btn-danger btn-sm uproot-btn" data-farmland-id="${farmland.id}" ${!isUprootAllowed ? 'disabled' : ''}>
            Uproot
          </button>
        </td>
    `;
    return row;
}

function setupFarmlandEventListeners(row, farmland) {
    const plantBtn = row.querySelector('.plant-btn');
    const clearBtn = row.querySelector('.clear-btn');
    const uprootBtn = row.querySelector('.uproot-btn');
    const farmlandCells = row.querySelectorAll('td:not(:last-child):not(.crop-column)');
    const cropColumn = row.querySelector('.crop-column');

    plantBtn.addEventListener('click', () => {
        showPlantingOverlay(farmland, () => displayFarmland());
    });

    clearBtn.addEventListener('click', () => {
        showClearingOverlay(farmland, () => displayFarmland());
    });

    uprootBtn.addEventListener('click', () => {
        showUprootOverlay(farmland, () => displayFarmland());
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

