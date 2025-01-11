
import { formatNumber, getWineQualityCategory, getColorClass, formatQualityDisplay } from '/js/utils.js';
import { showCrushingOverlay } from '/js/overlays/crushingOverlay.js';
import { showFermentationOverlay } from '/js/overlays/fermentationOverlay.js';
import { loadBuildings } from '/js/database/adminFunctions.js';

export function showWineryOverlay() {
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    overlay.innerHTML = `
        <div class="mainview-overlay-content overlay-container">
            <h2 class="mb-4">Winery Management</h2>
            
            <div class="overlay-sections">
                <section id="grapes-section" class="overlay-section card mb-4">
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

                <section id="must-section" class="inventory-section card mb-4">
                    <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                        <h3 class="h5 mb-0">Winery Processing</h3>
                        <button class="btn btn-success btn-sm" id="fermentMustBtn">Ferment Must</button>
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

    document.body.appendChild(overlay);

    const buildings = loadBuildings();
    const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
    const grapeStorageTableBody = document.getElementById('grape-storage-table');
    const mustStorageTableBody = document.getElementById('must-storage-table');

    if (grapeStorageTableBody) grapeStorageTableBody.innerHTML = '';
    if (mustStorageTableBody) mustStorageTableBody.innerHTML = '';

    buildings.forEach(building => {
        if (!building.tools) return;
        
        building.tools.forEach(tool => {
            if (tool.supportedResources?.includes('Grapes')) {
                const matchingInventoryItems = playerInventory.filter(item => 
                    item.storage === `${tool.name} #${tool.instanceNumber}` && 
                    item.state === 'Grapes'
                );
                populateStorageRow(grapeStorageTableBody, tool, matchingInventoryItems);
            }
            if (tool.supportedResources?.includes('Must')) {
                const matchingInventoryItems = playerInventory.filter(item => 
                    item.storage === `${tool.name} #${tool.instanceNumber}` && 
                    item.state === 'Must'
                );
                populateStorageRow(mustStorageTableBody, tool, matchingInventoryItems);
            }
        });
    });

    overlay.style.display = 'block';
    
    const crushButton = document.getElementById('crushGrapesBtn');
    if (crushButton) {
        crushButton.addEventListener('click', showCrushingOverlay);
    }
    
    const fermentButton = document.getElementById('fermentMustBtn');
    if (fermentButton) {
        fermentButton.addEventListener('click', showFermentationOverlay);
    }
}

function populateStorageRow(tableBody, tool, inventoryItems) {
    const firstItem = inventoryItems[0];
    const totalAmount = inventoryItems.reduce((sum, item) => sum + item.amount, 0);

    if (firstItem || tool) {
        const row = document.createElement('tr');
        let qualityDisplay = 'N/A';
        if (firstItem?.quality) {
            qualityDisplay = formatQualityDisplay(firstItem.quality);
        }

        row.innerHTML = `
            <td>${tool.name} #${tool.instanceNumber}</td>
            <td>${tool.capacity}</td>
            <td>${firstItem ? `<strong>${firstItem.fieldName}</strong>, ${firstItem.resource?.name || firstItem.resource}, ${firstItem.vintage || 'Unknown'}` : 'N/A'}</td>
            <td>${formatNumber(totalAmount)} t</td>
            <td>${qualityDisplay}</td>
        `;

        tableBody.appendChild(row);
    }
}
