
import { formatNumber, getWineQualityCategory, getColorClass } from '/js/utils.js';
import { populateStorageTable } from '/js/resource.js';
import { showCrushingOverlay } from '/js/overlays/crushingOverlay.js';
import { showFermentationOverlay } from '/js/overlays/fermentationOverlay.js';

export function showWineryOverlay() {
    // Remove any existing instances of the overlay
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create overlay element
    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    // Create content for the overlay
    overlay.innerHTML = `
        <div class="mainview-overlay-content">
            <h3>Winery</h3>
            <div class="winery-container">
                <section class="my-4">
                    <h4>Grapes in Storage</h4>
                    <button class="btn btn-primary mb-2" id="crushGrapesBtn">Crush Grapes</button>
                    <table class="table table-bordered">
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
                </section>

                <section class="my-4">
                    <h4>Must in Fermentation</h4>
                    <button class="btn btn-primary mb-2" id="fermentMustBtn">Ferment Must</button>
                    <table class="table table-bordered">
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
                </section>
            </div>
        </div>
    `;

    // Append overlay to document body
    document.body.appendChild(overlay);

    // Populate storage tables
    const buildings = JSON.parse(localStorage.getItem('buildings')) || [];
    const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
    const grapeStorageTableBody = document.getElementById('grape-storage-table');
    const mustStorageTableBody = document.getElementById('must-storage-table');

    // Clear existing table contents
    if (grapeStorageTableBody) grapeStorageTableBody.innerHTML = '';
    if (mustStorageTableBody) mustStorageTableBody.innerHTML = '';

    buildings.forEach(building => {
        building.contents.forEach(tool => {
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
    
    // Add click handlers for buttons
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
            const colorClass = getColorClass(firstItem.quality);
            qualityDisplay = `<span class="${colorClass}">(${(firstItem.quality * 100).toFixed(0)}%)</span>`;
        }

        row.innerHTML = `
            <td>${tool.name} #${tool.instanceNumber}</td>
            <td>${tool.capacity}</td>
            <td>${firstItem ? `<strong>${firstItem.fieldName}</strong>, ${firstItem.resource.name}, ${firstItem.vintage || 'Unknown'}` : 'N/A'}</td>
            <td>${formatNumber(totalAmount)} t</td>
            <td>${qualityDisplay}</td>
        `;

        tableBody.appendChild(row);
    }
}
