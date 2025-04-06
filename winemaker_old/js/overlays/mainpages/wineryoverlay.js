import { formatNumber, formatQualityDisplay } from '/js/utils.js';
import { showCrushingOverlay } from '/js/overlays/crushingOverlay.js';
import { showFermentationOverlay } from '/js/overlays/fermentationOverlay.js';
import { loadBuildings } from '/js/database/adminFunctions.js';
import { showMainViewOverlay } from '/js/overlays/overlayUtils.js';
import { inventoryInstance } from '/js/resource.js';
import { showWineInfoOverlay } from '../wineInfoOverlay.js';

export function showWineryOverlay() {
    const overlayContent = createWineryOverlayHTML();
    const overlay = showMainViewOverlay(overlayContent);
    
    if (tutorialManager.shouldShowTutorial('WINERY')) {
        tutorialManager.showTutorial('WINERY');
    }
    setupWineryOverlayEventListeners(overlay);
}

function createWineryOverlayHTML() {
    return `
        <div class="mainview-overlay-content overlay-container">
            <h2 class="mb-4">Winery Management</h2>
            <div class="overlay-sections">
                <section id="grapes-section" class="overlay-section card mb-4">
                    <img src="/assets/pic/warehouse_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Warehouse">
                    <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                        <h3 class="h5 mb-0">Warehouse Storage</h3>
                        <button class="btn btn-light btn-sm" id="crushGrapesBtn">Crush Grapes</button>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Container</th>
                                        <th>Capacity</th>
                                        <th>Resource</th>
                                        <th>Amount</th>
                                        <th>Quality</th>
                                    </tr>
                                </thead>
                                <tbody id="grape-storage-table">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section id="must-section" class="overlay-section card mb-4">
                    <img src="/assets/pic/winery_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Winery">
                    <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                        <h3 class="h5 mb-0">Winery Processing</h3>
                        <button class="btn btn-light btn-sm" id="fermentMustBtn">Ferment Must</button>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Container</th>
                                        <th>Capacity</th>
                                        <th>Resource</th>
                                        <th>Amount</th>
                                        <th>Quality</th>
                                    </tr>
                                </thead>
                                <tbody id="must-storage-table">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `;
}

export function updateWineryStorage() {
    const buildings = loadBuildings();
    const playerInventory = inventoryInstance.items;

    ['Grapes', 'Must'].forEach(resourceType => {
        const tableId = resourceType === 'Grapes' ? '#grape-storage-table' : '#must-storage-table';
        const tableBody = document.querySelector(tableId);
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        buildings.forEach(building => {
            if (!building.slots) return;
            
            building.slots.forEach(slot => {
                slot.tools.forEach(tool => {
                    if (tool.supportedResources?.includes(resourceType)) {
                        const toolId = `${tool.name} #${tool.instanceNumber}`;
                        const matchingInventoryItems = playerInventory.filter(item => 
                            item.storage === toolId && 
                            item.state === resourceType
                        );
                        populateStorageRow(tableBody, tool, matchingInventoryItems);
                    }
                });
            });
        });
    });
}

export function setupWineryOverlayEventListeners(overlay) {
    updateWineryStorage();

    const crushButton = overlay.querySelector('#crushGrapesBtn');
    if (crushButton) {
        crushButton.addEventListener('click', showCrushingOverlay);
    }

    const fermentButton = overlay.querySelector('#fermentMustBtn');
    if (fermentButton) {
        fermentButton.addEventListener('click', showFermentationOverlay);
    }
}

function populateStorageRow(tableBody, tool, inventoryItems) {
    // Only proceed if tool has capacity
    if (!tool || tool.capacity <= 0) return;

    const firstItem = inventoryItems[0];
    const totalAmount = inventoryItems.reduce((sum, item) => sum + item.amount, 0);

    if (firstItem || tool) {
        const row = document.createElement('tr');
        
        // Make entire row clickable for item info if there's content
        if (firstItem) {
            row.addEventListener('click', (e) => {
                // Don't trigger if clicking a button or other interactive element
                if (!e.target.closest('button')) {
                    showWineInfoOverlay(firstItem);
                }
            });
        }

        let qualityDisplay = 'N/A';
        if (firstItem?.quality) {
            qualityDisplay = formatQualityDisplay(firstItem.quality);
        }

        let formattedAmount;
        if (tool.supportedResources.includes('Must')) {
            formattedAmount = `${formatNumber(totalAmount)} l`;
        } else {
            formattedAmount = totalAmount >= 1000 ? 
                `${formatNumber(totalAmount / 1000, 2)} t` : 
                `${formatNumber(totalAmount)} kg`;
        }

        row.innerHTML = `
            <td>${tool.name} #${tool.instanceNumber}</td>
            <td>${tool.capacity}</td>
            <td>${firstItem ? `<strong>${firstItem.fieldName}</strong>, ${firstItem.resource?.name || firstItem.resource}, ${firstItem.vintage || 'Unknown'}` : 'N/A'}</td>
            <td>${formattedAmount}</td>
            <td>${qualityDisplay}</td>
        `;

        tableBody.appendChild(row);
    }
}
