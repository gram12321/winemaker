
import { loadBuildings } from '/js/database/adminFunctions.js';
import { inventoryInstance } from '/js/resource.js';
import { getColorClass } from '/js/utils.js';

export function showInventoryOverlay() {
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    overlay.innerHTML = `
        <div class="mainview-overlay-content">
            <h2>Inventory Overview</h2>
            
            <section>
                <h3>Warehouse Storage (Grapes)</h3>
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Container</th>
                            <th>Capacity</th>
                            <th>Resource</th>
                            <th>Amount</th>
                            <th>Quality</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="grape-storage-body"></tbody>
                </table>
            </section>

            <section>
                <h3>Winery Storage (Must)</h3>
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Container</th>
                            <th>Capacity</th>
                            <th>Resource</th>
                            <th>Amount</th>
                            <th>Quality</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="must-storage-body"></tbody>
                </table>
            </section>

            <section>
                <h3>Wine Cellar (Bottles)</h3>
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Resource</th>
                            <th>Amount</th>
                            <th>Quality</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="wine-storage-body"></tbody>
                </table>
            </section>
        </div>
    `;

    document.body.appendChild(overlay);
    populateInventoryTables();
    overlay.style.display = 'block';
}

function populateInventoryTables() {
    const buildings = loadBuildings();
    const grapeStorageBody = document.getElementById('grape-storage-body');
    const mustStorageBody = document.getElementById('must-storage-body');
    const wineStorageBody = document.getElementById('wine-storage-body');

    if (!grapeStorageBody || !mustStorageBody || !wineStorageBody) {
        console.error('Could not find table bodies');
        return;
    }

    // Clear existing content
    grapeStorageBody.innerHTML = '';
    mustStorageBody.innerHTML = '';
    wineStorageBody.innerHTML = '';

    // Populate storage containers for grapes and must
    buildings.forEach(building => {
        if (!building.tools) return;
        
        building.tools.forEach(tool => {
            if (tool.supportedResources?.includes('Grapes')) {
                const storageId = `${tool.name} #${tool.instanceNumber}`;
                const items = inventoryInstance.getStorageContents(storageId);
                const row = createStorageRow(tool, items);
                grapeStorageBody.appendChild(row);
            }
            if (tool.supportedResources?.includes('Must')) {
                const storageId = `${tool.name} #${tool.instanceNumber}`;
                const items = inventoryInstance.getStorageContents(storageId);
                const row = createStorageRow(tool, items);
                mustStorageBody.appendChild(row);
            }
        });
    });

    // Populate bottled wines
    const bottledWines = inventoryInstance.getItemsByState('Bottles');
    bottledWines.forEach(item => {
        const row = document.createElement('tr');
        const qualityDisplay = item.quality ? 
            `<span class="${getColorClass(item.quality)}">(${(item.quality * 100).toFixed(0)}%)</span>` : 
            'N/A';

        row.innerHTML = `
            <td>${item.fieldName}, ${item.resource.name}, ${item.vintage}</td>
            <td>${item.amount} bottles</td>
            <td>${qualityDisplay}</td>
            <td>Bottles</td>
        `;
        wineStorageBody.appendChild(row);
    });
}

function createStorageRow(tool, items) {
    const row = document.createElement('tr');
    const firstItem = items[0];
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const qualityDisplay = firstItem?.quality ? 
        `<span class="${getColorClass(firstItem.quality)}">(${(firstItem.quality * 100).toFixed(0)}%)</span>` : 
        'N/A';

    row.innerHTML = `
        <td>${tool.name} #${tool.instanceNumber}</td>
        <td>${tool.capacity}</td>
        <td>${firstItem ? 
            `${firstItem.fieldName}, ${firstItem.resource.name}, ${firstItem.vintage}` : 
            'Empty'}</td>
        <td>${firstItem ? `${totalAmount} t` : '0 t'}</td>
        <td>${qualityDisplay}</td>
        <td>${firstItem ? firstItem.state : 'Empty'}</td>
    `;

    return row;
}
