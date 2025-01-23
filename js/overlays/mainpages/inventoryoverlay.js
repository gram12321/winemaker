
import { loadBuildings } from '/js/database/adminFunctions.js';
import { inventoryInstance } from '/js/resource.js';
import { formatNumber, getWineQualityCategory, formatQualityDisplay } from '/js/utils.js';
import { showMainViewOverlay } from '../overlayUtils.js';

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
                                    </tr>
                                </thead>
                                <tbody id="grape-storage-body"></tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section id="must-section" class="inventory-section card mb-4">
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
function populateInventoryTables() {
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
        if (!building.tools) return;
        
        building.tools.forEach(tool => {
            if (tool.supportedResources?.includes(resourceType)) {
                const storageId = `${tool.name} #${tool.instanceNumber}`;
                const items = inventoryInstance.getStorageContents(storageId);
                const row = createStorageRow(tool, items);
                tableBody.appendChild(row);
            }
        });
    });
}

function createStorageRow(tool, items) {
    const row = document.createElement('tr');
    const firstItem = items[0];
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

    row.innerHTML = `
        <td>${tool.name} #${tool.instanceNumber}</td>
        <td>${formatNumber(tool.capacity)}</td>
        <td>${firstItem ? firstItem.getDisplayInfo().name : 'Empty'}</td>
        <td>${firstItem ? formattedAmount : (tool.supportedResources.includes('Must') ? '0 l' : '0 kg')}</td>
        <td>${firstItem ? formatQualityDisplay(firstItem.quality) : 'N/A'}</td>
        <td>${firstItem ? firstItem.state : 'Empty'}</td>
    `;

    return row;
}

function updateWineTable() {
    const wineStorageBody = document.getElementById('wine-storage-body');
    if (!wineStorageBody) return;

    wineStorageBody.innerHTML = '';
    const bottledWines = inventoryInstance.getItemsByState('Bottles');
    
    bottledWines.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.getDisplayInfo().name}</td>
            <td>${formatNumber(item.amount)} bottles</td>
            <td>${formatQualityDisplay(item.quality)}</td>
            <td>Bottles</td>
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
