
import { formatNumber, formatQualityDisplay  } from '/js/utils.js';
import { calculateWinePrice, sellWines, sellOrderWine } from '/js/sales.js';
import { inventoryInstance } from '/js/resource.js';
import { loadWineOrders, saveWineOrders } from '/js/database/adminFunctions.js';
import { showMainViewOverlay } from '/js/overlays/overlayUtils.js';
import { updateAllDisplays } from '/js/displayManager.js';

// Display the main sales overlay with wine cellar inventory and orders
export function showSalesOverlay() {
    const overlay = showMainViewOverlay(createSalesOverlayHTML());
    setupSalesOverlayEventListeners(overlay);
}

function createSalesOverlayHTML() {
    return `
    <div class="container-fluid">
        <div class="row">
            <!-- Wine Cellar Inventory Section -->
            <section id="winecellar-section" class="overlay-section card mb-4">
                <img src="/assets/pic/cellar_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Wine Cellar">
                <div class="card-header text-white">
                    <h3 class="h5 mb-0">Wine Cellar Inventory</h3>
                </div>
                <div class="card-body">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Wine</th>
                                <th>Storage</th>
                                <th>Amount</th>
                                <th>Quality</th>
                                <th>Base Price</th>
                                <th>Custom Price</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="winecellar-table-body">
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Wine Orders Section -->
            <section id="orders-section" class="overlay-section card mb-4">
                <img src="/assets/pic/sales_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Wine Sales">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Wine Orders</h3>
                    <div class="filters d-flex gap-2">
                        <select id="type-filter" class="form-control form-control-sm d-inline-block w-auto">
                            <option value="">All Types</option>
                            <option value="Private Order">Private Order</option>
                            <option value="Engross Order">Engross Order</option>
                        </select>
                        <select id="resource-filter" class="form-control form-control-sm d-inline-block w-auto">
                            <option value="">All Wines</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
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
            </section>
        </div>
    </div>
    `;
}

function setupSalesOverlayEventListeners(overlay) {
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
        const basePrice = calculateWinePrice(wine.quality, wine);
        const customPrice = wine.customPrice || '';

        row.innerHTML = `
            <td><strong>${displayInfo.name}</strong></td>
            <td>${displayInfo.storage}</td>
            <td>${formatNumber(displayInfo.amount)} bottles</td>
            <td>${formatQualityDisplay(wine.quality)}</td>
            <td>€${basePrice.toFixed(2)}</td>
            <td>
                <div class="input-group input-group-sm">
                    <span class="input-group-text">€</span>
                    <input type="number" class="form-control custom-price-input" min="0.01" step="0.01" value="${customPrice}" 
                           data-wine-name="${wine.resource.name}" data-wine-vintage="${wine.vintage}" 
                           data-wine-storage="${wine.storage}" placeholder="Set price">
                </div>
            </td>
            <td>
                <button class="btn-alternative sell-wine-btn" data-wine-name="${wine.resource.name}" 
                        data-wine-vintage="${wine.vintage}" data-wine-storage="${wine.storage}"
                        ${!customPrice ? 'disabled' : ''}>
                    Sell
                </button>
            </td>
        `;

        // Event listeners
        const priceInput = row.querySelector('.custom-price-input');
        const sellButton = row.querySelector('.sell-wine-btn');
        
        priceInput.addEventListener('input', (e) => {
            const price = parseFloat(e.target.value);
            const wineName = e.target.dataset.wineName;
            const wineVintage = e.target.dataset.wineVintage;
            const wineStorage = e.target.dataset.wineStorage;
            
            // Update the wine's custom price
            const wineItem = inventoryInstance.items.find(item => 
                item.resource.name === wineName && 
                item.vintage === wineVintage && 
                item.storage === wineStorage && 
                item.state === 'Bottles'
            );
            
            if (wineItem) {
                wineItem.customPrice = price || null;
                inventoryInstance.save();
            }
            
            // Enable/disable sell button
            sellButton.disabled = !price;
        });

        sellButton.addEventListener('click', () => {
            if (sellButton.disabled) return;
            sellWines(sellButton.dataset.wineName);
            displayWineCellarInventory();
        });

        tableBody.appendChild(row);
    });
}

let currentOrders = [];
let currentSortKey = null;
let currentSortDirection = 'asc';

function setupEventListeners() {
    // Sort headers
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.getAttribute('data-sort');
            if (currentSortKey === sortKey) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortKey = sortKey;
                currentSortDirection = 'asc';
            }
            refreshDisplay();
        });
    });

    // Filters
    document.getElementById('type-filter').addEventListener('change', refreshDisplay);
    document.getElementById('resource-filter').addEventListener('change', refreshDisplay);
}

function populateResourceFilter() {
    const resourceFilter = document.getElementById('resource-filter');
    const resources = new Set();

    currentOrders.forEach(order => {
        resources.add(order.resourceName);
    });

    // Clear existing options except the first one
    while (resourceFilter.options.length > 1) {
        resourceFilter.remove(1);
    }

    // Add new options
    Array.from(resources).sort().forEach(resource => {
        const option = document.createElement('option');
        option.value = resource;
        option.textContent = resource;
        resourceFilter.appendChild(option);
    });
}

function filterOrders(orders) {
    const typeFilter = document.getElementById('type-filter').value;
    const resourceFilter = document.getElementById('resource-filter').value;

    return orders.filter(order => {
        if (typeFilter && order.type !== typeFilter) return false;
        if (resourceFilter && order.resourceName !== resourceFilter) return false;
        return true;
    });
}

function sortOrders(orders, key, direction) {
    return [...orders].sort((a, b) => {
        if (direction === 'asc') {
            return a[key] - b[key];
        } else {
            return b[key] - a[key];
        }
    });
}

function refreshDisplay() {
    let orders = filterOrders(currentOrders);
    if (currentSortKey) {
        orders = sortOrders(orders, currentSortKey, currentSortDirection);
    }
    displayFilteredOrders(orders);
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
        const priceCellClass = "";

        row.innerHTML = `
            <td class="text-center">${typeInfo}</td>
            <td><strong>${order.resourceName}</strong><br><small>Vintage ${order.vintage}</small></td>
            <td>${formatQualityDisplay(quality)}</td>
            <td style="text-align: right;">${displayAmount}</td>
            <td class="${priceCellClass}" style="text-align: right;">€${order.wineOrderPrice.toFixed(2)}</td>
            <td>
                <button class="btn-alternative complete-order-btn" data-order-index="${originalIndex}">
                    Complete Order
                </button>
            </td>
        `;

        row.querySelector('.complete-order-btn').addEventListener('click', (e) => {
            const orderIndex = parseInt(e.target.dataset.orderIndex);
            if (sellOrderWine(orderIndex)) {
                displayWineOrders();
            }
        });

        wineOrdersTableBody.appendChild(row);
    });
}
