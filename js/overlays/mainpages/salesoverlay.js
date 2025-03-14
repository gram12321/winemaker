import { formatNumber, formatQualityDisplay } from '/js/utils.js';
import { calculateWinePrice, sellOrderWine } from '/js/sales.js';
import { inventoryInstance } from '/js/resource.js';
import { loadWineOrders, saveWineOrders } from '/js/database/adminFunctions.js';
import { showMainViewOverlay } from '/js/overlays/overlayUtils.js';
import { updateAllDisplays } from '/js/displayManager.js';
import { WINE_ORDER_TYPES } from '/js/constants/constants.js';
import { displayContractsTab } from '/js/overlays/contractstab.js';
import { addConsoleMessage } from '/js/console.js';
import { showWineInfoOverlay } from '/js/overlays/wineInfoOverlay.js';  // Add this import

// Display the main sales overlay with wine cellar inventory and orders
export function showSalesOverlay() {
    const overlay = showMainViewOverlay(createSalesOverlayHTML());
    setupSalesOverlayEventListeners(overlay);
}

function setupSalesOverlayEventListeners(overlay) {
    // Set up tab navigation
    const tabs = overlay.querySelectorAll('.sales-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.view;
            
            // Update active tab
            overlay.querySelectorAll('.sales-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show/hide content sections
            overlay.querySelectorAll('.sales-section').forEach(section => {
                section.style.display = section.id === `${target}-section` ? 'block' : 'none';
            });
            
            // If switching to contracts tab, load the contracts
            if (target === 'contracts') {
                displayContractsTab();
            }
        });
    });

    displayWineCellarInventory();
    displayWineOrders();
}

export function displayWineCellarInventory() {
    const tableBody = document.getElementById('winecellar-table-body');
    tableBody.innerHTML = '';

    const bottledWines = inventoryInstance.getItemsByState('Bottles');

    bottledWines.forEach(wine => {
        const row = document.createElement('tr');
        const displayInfo = wine.getDisplayInfo();
        const sellingPrice = calculateWinePrice(wine.quality, wine);

        // Make row clickable (same as inventory overlay)
        row.style.cursor = 'pointer';
        row.addEventListener('click', (e) => {
            // Don't show wine info if clicking the price input or button
            if (!e.target.closest('.price-input, .set-price-btn')) {
                showWineInfoOverlay(wine);
            }
        });

        row.innerHTML = `
            <td><strong>${displayInfo.name}</strong></td>
            <td>${displayInfo.storage}</td>
            <td>${formatNumber(displayInfo.amount)} bottles</td>
            <td>${formatQualityDisplay(wine.quality)}</td>
            <td>
                <div class="input-group input-group-sm">
                    <span class="input-group-text">€</span>
                    <input type="number" class="form-control price-input" min="0.01" step="0.01" placeholder="Enter price" 
                           data-base-price="${sellingPrice.toFixed(2)}" value="${wine.customPrice ? wine.customPrice.toFixed(2) : ''}">
                </div>
            </td>
            <td>€${sellingPrice.toFixed(2)}</td>
            <td>
                <button class="btn-alternative set-price-btn" 
                        data-wine-name="${wine.resource.name}" 
                        data-wine-vintage="${wine.vintage}" 
                        data-wine-storage="${wine.storage}"
                        data-wine-field="${wine.fieldName}">
                    Set Price
                </button>
            </td>
        `;

        const priceInput = row.querySelector('.price-input');
        const setPriceButton = row.querySelector('.set-price-btn');
        
        setPriceButton.addEventListener('click', () => {
            const price = parseFloat(priceInput.value);
            if (!isNaN(price) && price > 0) {
                // Save the custom price and update the display
                const wineItem = inventoryInstance.items.find(item => 
                    item.resource.name === setPriceButton.dataset.wineName && 
                    item.vintage === parseInt(setPriceButton.dataset.wineVintage) &&
                    item.storage === setPriceButton.dataset.wineStorage &&
                    item.fieldName === setPriceButton.dataset.wineField
                );
                if (wineItem) {
                    wineItem.customPrice = price;
                    inventoryInstance.save();
                    displayWineCellarInventory();
                }
            } else {
                alert("Please enter a valid price.");
            }
        });

        tableBody.appendChild(row);
    });
}

let currentOrders = [];
let currentSortKey = null;
let currentSortDirection = 'asc';

function populateResourceFilter() {
    const resourceFilter = document.getElementById('resource-filter');
    const uniqueResources = [...new Set(currentOrders.map(order => order.resourceName))];
    resourceFilter.innerHTML = '<option value="">All Wines</option>';
    uniqueResources.forEach(resource => {
        resourceFilter.innerHTML += `<option value="${resource}">${resource}</option>`;
    });
}

// Filter wine orders based on selected type and resource filters
function filterOrders(orders) {
    // Get current filter values from the UI
    const typeFilter = document.getElementById('type-filter')?.value;
    const resourceFilter = document.getElementById('resource-filter')?.value;

    return orders.filter(order => {
        const matchesType = !typeFilter || order.type === typeFilter;
        const matchesResource = !resourceFilter || order.resourceName === resourceFilter;
        return matchesType && matchesResource;
    });
}

function sortOrders(orders, sortKey, direction) {
    return [...orders].sort((a, b) => {
        const aValue = parseFloat(a[sortKey]);
        const bValue = parseFloat(b[sortKey]);
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
}

function setupEventListeners() {
    const typeFilter = document.getElementById('type-filter');
    const resourceFilter = document.getElementById('resource-filter');
    const newTypeFilter = typeFilter.cloneNode(true);
    const newResourceFilter = resourceFilter.cloneNode(true);

    typeFilter.parentNode.replaceChild(newTypeFilter, typeFilter);
    resourceFilter.parentNode.replaceChild(newResourceFilter, resourceFilter);

    newTypeFilter.addEventListener('change', refreshDisplay);
    newResourceFilter.addEventListener('change', refreshDisplay);

    // Setup sorting
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const sortKey = th.dataset.sort;
            if (currentSortKey === sortKey) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortKey = sortKey;
                currentSortDirection = 'asc';
            }
            refreshDisplay();
        });
    });

    // Add event listeners for bulk action buttons - simplified without filtering
    const sellAllBtn = document.getElementById('sell-all-btn');
    const refuseAllBtn = document.getElementById('refuse-all-btn');

    if (sellAllBtn) {
        sellAllBtn.addEventListener('click', () => {
            sellAllOrders();
        });
    }

    if (refuseAllBtn) {
        refuseAllBtn.addEventListener('click', () => {
            refuseAllOrders();
        });
    }
}

function refreshDisplay() {
    let orders = filterOrders(currentOrders);
    if (currentSortKey) {
        orders = sortOrders(orders, currentSortKey, currentSortDirection);
    }
    displayFilteredOrders(orders);
}

// Add new function to get current filtered and sorted orders
function getCurrentFilteredOrders() {
    let orders = filterOrders(currentOrders);
    if (currentSortKey) {
        orders = sortOrders(orders, currentSortKey, currentSortDirection);
    }
    return orders;
}

export function displayWineOrders() {
    const wineOrdersTableBody = document.getElementById('wine-orders-table-body');
    wineOrdersTableBody.innerHTML = '';
    currentOrders = loadWineOrders();  // Changed from getCurrentWineOrders

    setupEventListeners();
    populateResourceFilter();
    refreshDisplay();
}

function displayFilteredOrders(filteredOrders) {
    const wineOrdersTableBody = document.getElementById('wine-orders-table-body');
    wineOrdersTableBody.innerHTML = '';

    // Create a map of filtered orders to their original indices
    const originalOrders = loadWineOrders();
    const orderIndices = filteredOrders.map(order => 
        originalOrders.findIndex(o => 
            o.resourceName === order.resourceName &&
            o.vintage === order.vintage &&
            o.quality === order.quality &&
            o.amount === order.amount &&
            o.type === order.type &&
            o.wineOrderPrice === order.wineOrderPrice
        )
    );

    // Only show bulk action buttons if we have orders
    const bulkActionsContainer = document.getElementById('bulk-actions-container');
    if (bulkActionsContainer) {
        bulkActionsContainer.style.display = filteredOrders.length > 0 ? 'flex' : 'none';
    }

    filteredOrders.forEach((order, displayIndex) => {
        const row = document.createElement('tr');
        const quality = parseFloat(order.quality);
        const originalIndex = orderIndices[displayIndex];

        let iconPath;
        switch (order.type) {
            case "Private Order":
                iconPath = '/assets/icon/icon_privateorder.webp';
                break;
            case "Engross Order":
                iconPath = '/assets/icon/icon_engrossorder.webp';
                break;
        }

        const typeInfo = iconPath 
            ? `<img src="${iconPath}" alt="${order.type}" class="status-image">`
            : '';

        const displayAmount = `${order.amount} Bottles`;

        row.innerHTML = `
            <td style="text-align: center;"><strong>${typeInfo}<br>${order.type}</strong></td>
            <td><strong>${order.fieldName || ''}</strong>, ${order.resourceName || ''}, ${order.vintage || ''}</td>
            <td>${formatQualityDisplay(quality)}</td>
            <td>${displayAmount}</td>
            <td>€${formatNumber(order.wineOrderPrice, 2)}</td>
            <td>
                <button class="btn-alternative sell-order-btn" data-original-index="${originalIndex}">Sell</button>
                <button class="btn refuse-order-btn" data-original-index="${originalIndex}">Refuse</button>
            </td>
        `;

        const sellButton = row.querySelector('.sell-order-btn');
        sellButton.addEventListener('click', () => {
            const orderIndex = parseInt(sellButton.dataset.originalIndex);
            if (sellOrderWine(orderIndex)) {
                // Refresh the wine orders display after successful sale
                displayWineOrders();
                updateAllDisplays();
            }
        });

        const refuseButton = row.querySelector('.refuse-order-btn');
        refuseButton.addEventListener('click', () => {
            const orderIndex = parseInt(refuseButton.dataset.originalIndex);
            const wineOrders = loadWineOrders();
            wineOrders.splice(orderIndex, 1);
            saveWineOrders(wineOrders);
            updateAllDisplays();
        });

        wineOrdersTableBody.appendChild(row);
    });
}

function createSalesOverlayHTML() {
    return `
        <div class="mainview-overlay-content">
            <h3>Sales</h3>
            
            <!-- Tab Navigation -->
            <div class="d-flex flex-column">
                <div class="btn-group mb-4">
                    <button class="btn btn-outline-primary sales-tab active" data-view="cellar">Wine Cellar</button>
                    <button class="btn btn-outline-primary sales-tab" data-view="orders">Orders</button>
                    <button class="btn btn-outline-primary sales-tab" data-view="contracts">Contracts</button>
                </div>
            </div>

            <!-- Wine Cellar Inventory Section -->
            <section id="cellar-section" class="sales-section overlay-section card mb-4">
                <img src="/assets/pic/winecellar_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Wine Cellar">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Wine Cellar Inventory</h3>
                </div>
                <div class="card-body">
                <table class="table overlay-table">
                    <thead>
                        <tr>
                            <th>Wine</th>
                            <th>Storage</th>
                            <th>Amount</th>
                            <th>Quality</th>
                            <th>Order Type</th>
                            <th>Bulk Price</th>
                            <th>Bulk Sales</th>
                        </tr>
                    </thead>
                    <tbody id="winecellar-table-body">
                    </tbody>
                </table>
            </section>

            <!-- Wine Orders Section -->
            <section id="orders-section" class="sales-section overlay-section card mb-4" style="display: none;">
                <img src="/assets/pic/sales_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Wine Sales">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Wine Orders</h3>
                    <div class="filters d-flex gap-2">
                        <select id="type-filter" class="form-control form-control-sm d-inline-block w-auto">
                            <option value="">All Types</option>
                            ${Object.keys(WINE_ORDER_TYPES).map(type => `<option value="${type}">${type}</option>`).join('')}
                        </select>
                        <select id="resource-filter" class="form-control form-control-sm d-inline-block w-auto">
                            <option value="">All Wines</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Bulk Action Buttons -->
                    <div id="bulk-actions-container" class="d-flex justify-content-end mb-3" style="display: none;">
                        <button class="btn btn-success btn-sm me-2" id="sell-all-btn">Sell All</button>
                        <button class="btn btn-danger btn-sm" id="refuse-all-btn">Refuse All</button>
                    </div>
                    
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Order Type</th>
                                <th>Wine</th>
                                <th>Quality</th>
                                <th data-sort="amount" style="cursor: pointer">Amount ↕</th>
                                <th data-sort="wineOrderPrice" style="cursor: pointer">Offered Price/Bottle ↕</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="wine-orders-table-body">
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Contracts Section -->
            <section id="contracts-section" class="sales-section overlay-section card mb-4" style="display: none;">
                <img src="/assets/pic/sales_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Wine Contracts">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Importer Contracts</h3>
                </div>
                <div class="card-body" id="contracts-tab-content">
                    <!-- Contracts content will be loaded here -->
                </div>
            </section>
        </div>
    `;
}

/**
 * Sell all orders - no filtering
 */
function sellAllOrders() {
    const wineOrders = loadWineOrders();
    if (wineOrders.length === 0) return;
    
    let successCount = 0;
    let failCount = 0;
    
    // Process in reverse order to avoid index shifting issues
    for (let i = wineOrders.length - 1; i >= 0; i--) {
        const success = sellOrderWine(i);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
    }
    
    // Report results
    if (successCount > 0 || failCount > 0) {
        let message = '';
        if (successCount > 0) {
            message += `Successfully sold ${successCount} orders. `;
        }
        if (failCount > 0) {
            message += `Failed to sell ${failCount} orders due to insufficient inventory.`;
        }
        addConsoleMessage(message);
    }
    
    // Refresh display
    displayWineOrders();
    updateAllDisplays();
}

/**
 * Refuse all orders - no filtering
 */
function refuseAllOrders() {
    const wineOrders = loadWineOrders();
    if (wineOrders.length === 0) return;
    
    // Simply clear all orders
    saveWineOrders([]);
    
    // Report results
    addConsoleMessage(`Refused ${wineOrders.length} orders.`);
    
    // Refresh display
    displayWineOrders();
    updateAllDisplays();
}
