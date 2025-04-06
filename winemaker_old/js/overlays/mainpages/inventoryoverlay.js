import { loadBuildings } from '/js/database/adminFunctions.js';
import { inventoryInstance } from '/js/resource.js';
import { formatNumber, formatQualityDisplay } from '/js/utils.js';
import { showMainViewOverlay } from '../overlayUtils.js';
import { addConsoleMessage } from '/js/console.js';
import { addTransaction } from '/js/finance.js';
import { showWineInfoOverlay } from '../wineInfoOverlay.js';

export function showInventoryOverlay() {
    const overlay = showMainViewOverlay(createInventoryOverlayHTML());
    setupInventoryEventListeners(overlay);
    populateInventoryTables();
}

function createInventoryOverlayHTML() {
    return `
        <div class="mainview-overlay-content overlay-container">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="me-4">Inventory Management</h2>
            </div>
            <div class="btn-group ms-2">
                <button class="btn btn-outline-primary active" data-view="all">All</button>
                <button class="btn btn-outline-primary" data-view="grapes">Warehouse</button>
                <button class="btn btn-outline-primary" data-view="must">Winery</button>
                <button class="btn btn-outline-primary" data-view="wine">Cellar</button>
            </div>
            
            <div class="inventory-sections">
                <section id="grapes-section" class="inventory-section card mb-4">
                    <img src="/assets/pic/warehouse_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Warehouse">
                    <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                        <h3 class="h5 mb-0">Warehouse</h3>
                        <span class="badge badge-light" id="grapes-total"></span>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive inventory-table">
                            <table class="table table-hover inventory-table">
                                <thead>
                                    <tr>
                                        <th>Container</th>
                                        <th>Capacity</th>
                                        <th>Resource</th>
                                        <th>Amount</th>
                                        <th>Quality</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody id="grape-storage-body"></tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section id="must-section" class="inventory-section card mb-4">
                    <img src="/assets/pic/winery_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Winery">
                    <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                        <h3 class="h5 mb-0">Winery</h3>
                        <span class="badge badge-light" id="must-total"></span>
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
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="must-storage-body"></tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section id="wine-section" class="inventory-section card">
                    <img src="/assets/pic/winecellar_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Wine Cellar">
                    <div class="card-header bg-danger text-white d-flex justify-content-between align-items-center">
                        <h3 class="h5 mb-0">Cellar</h3>
                        <span class="badge badge-light" id="wine-total"></span>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Wine</th>
                                        <th>Amount</th>
                                        <th>Quality</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="wine-storage-body"></tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `;
}

function setupInventoryEventListeners(overlay) {
    const btnGroup = overlay.querySelector('.btn-group');
    btnGroup.addEventListener('click', (e) => {
        if (!e.target.matches('button')) return;
        
        // Update active button
        btnGroup.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // Show/hide sections based on selected view
        const view = e.target.dataset.view;
        const sections = overlay.querySelectorAll('.inventory-section');
        sections.forEach(section => {
            if (view === 'all' || section.id.startsWith(view)) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    });
}

// Helper functions
export function populateInventoryTables() {
    const buildings = loadBuildings();
    updateStorageTable('grape', buildings, 'Grapes');
    updateStorageTable('must', buildings, 'Must');
    updateWineTable();
    updateTotals();
}

function updateStorageTable(type, buildings, resourceType) {
    const tableBody = document.getElementById(`${type}-storage-body`);
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    buildings.forEach(building => {
        if (!building.slots) return;
        
        building.slots.forEach(slot => {
            slot.tools.forEach(tool => {
                // Only show tools that have storage capacity
                if (tool.supportedResources?.includes(resourceType) && tool.capacity > 0) {
                    const storageId = `${tool.name} #${tool.instanceNumber}`;
                    const items = inventoryInstance.getStorageContents(storageId);
                    const row = createStorageRow(tool, items);
                    tableBody.appendChild(row);
                }
            });
        });
    });
}

function createStorageRow(tool, items) {
    const row = document.createElement('tr');
    const firstItem = items[0];
    
    // Make entire row clickable for item info, similar to vineyard overlay pattern
    if (firstItem) {
        row.addEventListener('click', (e) => {
            // Don't trigger if clicking the sell button
            if (!e.target.closest('.sell-grapes-btn')) {
                showWineInfoOverlay(firstItem);
            }
        });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const qualityDisplay = firstItem?.getQualityDisplay() || 'N/A';

    let formattedAmount;
    if (tool.supportedResources.includes('Must')) {
        formattedAmount = `${formatNumber(totalAmount)} l`;
    } else {
        formattedAmount = totalAmount >= 1000 ? 
            `${formatNumber(totalAmount / 1000, 2)} t` : 
            `${formatNumber(totalAmount)} kg`;
    }

    const status = firstItem ? firstItem.state : 'Empty';
    const statusDisplay = status === 'Empty' 
        ? '<span class="text-muted">Empty</span>'
        : `<img src="/assets/pic/${status.toLowerCase()}.webp" alt="${status}" title="${status}" class="status-icon">`;

    // Add sell button for warehouse items (Grapes state)
    const sellButton = firstItem && firstItem.state === 'Grapes' ? 
        `<button class="btn-alternative sell-grapes-btn" 
            data-resource="${firstItem.resource.name}"
            data-storage="${tool.name} #${tool.instanceNumber}">
            Sell (€5/kg)
        </button>` : '';

    row.innerHTML = `
        <td>${tool.name} #${tool.instanceNumber}</td>
        <td>${formatNumber(tool.capacity)}</td>
        <td>${firstItem ? firstItem.getDisplayInfo().name : 'Empty'}</td>
        <td>${firstItem ? formattedAmount : (tool.supportedResources.includes('Must') ? '0 l' : '0 kg')}</td>
        <td>${firstItem ? formatQualityDisplay(firstItem.quality) : 'N/A'}</td>
        <td>${statusDisplay}</td>
        <td>${sellButton}</td>
    `;

    // Add event listener for sell button if it exists
    const sellBtn = row.querySelector('.sell-grapes-btn');
    if (sellBtn) {
        sellBtn.addEventListener('click', () => {
            const resourceName = sellBtn.dataset.resource;
            const storage = sellBtn.dataset.storage;
            sellGrapes(resourceName, storage);
            populateInventoryTables(); // Refresh tables after selling
        });
    }

    return row;
}

// Add new helper function to sell grapes
function sellGrapes(resourceName, storage) {
    const item = inventoryInstance.items.find(item => 
        item.resource.name === resourceName && 
        item.storage === storage &&
        item.state === 'Grapes'
    );

    if (item && item.amount > 0) {
        const amount = item.amount;  // Store amount before removing resource
        const sellingPrice = amount * 5; // €5 per kg
        if (inventoryInstance.removeResource(
            { name: resourceName },
            amount,
            'Grapes',
            item.vintage,
            storage
        )) {
            const formattedAmount = amount >= 1000 ? 
                `${formatNumber(amount / 1000, 2)} tonnes` : 
                `${formatNumber(amount)} kg`;
            
            addConsoleMessage(`Sold ${formattedAmount} of ${resourceName} grapes for €${formatNumber(sellingPrice)}`);
            addTransaction('Income', 'Grape Sale', sellingPrice);
            inventoryInstance.save();
        }
    }
}

function updateWineTable() {
    const wineStorageBody = document.getElementById('wine-storage-body');
    if (!wineStorageBody) return;

    wineStorageBody.innerHTML = '';
    const bottledWines = inventoryInstance.getItemsByState('Bottles');
    
    bottledWines.forEach(item => {
        const statusImage = `<img src="/assets/pic/bottles.webp" alt="Bottles" title="Bottles" class="status-icon">`;
        const row = document.createElement('tr');
        // Make row clickable using existing table hover styles
        row.addEventListener('click', () => showWineInfoOverlay(item));
        row.innerHTML = `
            <td>${item.getDisplayInfo().name}</td>
            <td>${formatNumber(item.amount)} bottles</td>
            <td>${formatQualityDisplay(item.quality)}</td>
            <td>${statusImage}</td>
        `;
        wineStorageBody.appendChild(row);
    });
}

function updateTotals() {
    ['grapes', 'must', 'wine'].forEach(type => {
        const total = inventoryInstance.getItemsByState(type === 'wine' ? 'Bottles' : type.charAt(0).toUpperCase() + type.slice(1)).reduce((sum, item) => sum + item.amount, 0);
        const badge = document.getElementById(`${type}-total`);
        if (badge) {
            badge.textContent = `Total: ${formatNumber(total)} ${type === 'wine' ? 'bottles' : 't'}`;
        }
    });
}
