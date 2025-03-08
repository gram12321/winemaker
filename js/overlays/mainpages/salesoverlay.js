import { formatNumber, formatQualityDisplay  } from '/js/utils.js';
import { calculateWinePrice, calculateBaseWinePrice, sellWines, sellOrderWine, shouldGenerateWineOrder } from '/js/sales.js';
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
        <div class="mainview-content">
            <h2 class="mainview-header">Sales Department</h2>

            <div class="price-setting-container mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5>Wine Pricing</h5>
                    </div>
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="wine-price-input">Set Wine Price (€):</label>
                                    <input type="number" id="wine-price-input" class="form-control" placeholder="Enter price" min="0" step="0.01">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <button id="set-price-btn" class="btn mt-2">Set Price</button>
                                <p class="mt-2 mb-0"><small>Current Price: <span id="current-price-display">Not set</span></small></p>
                                <p><small>Base Price Reference: <span id="base-price-reference">-</span></small></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <section id="wine-cellar-section">
                <h3>Wine Cellar Inventory</h3>
                <table class="table table-hover overlay-table">
                    <thead>
                        <tr>
                            <th>Wine</th>
                            <th>Storage</th>
                            <th>Amount</th>
                            <th>Quality</th>
                            <th>Sale Type</th>
                            <th>Price</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="winecellar-table-body">
                    </tbody>
                </table>
            </section>

            <section id="wine-orders-section">
                <h3>Wine Orders</h3>
                <div class="filter-controls">
                    <div class="row align-items-center mb-3">
                        <div class="col-md-4">
                            <select id="resource-filter" class="form-control form-control-sm">
                                <option value="">All Resources</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <select id="vintage-filter" class="form-control form-control-sm">
                                <option value="">All Vintages</option>
                            </select>
                        </div>
                    </div>
                </div>
                <table class="table table-hover overlay-table">
                    <thead>
                        <tr>
                            <th data-sort="type" style="cursor: pointer">Order Type ↕</th>
                            <th data-sort="resourceName" style="cursor: pointer">Resource ↕</th>
                            <th data-sort="vintage" style="cursor: pointer">Vintage ↕</th>
                            <th data-sort="quality" style="cursor: pointer">Quality ↕</th>
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
    `;
}

function setupSalesOverlayEventListeners(overlay) {
    // Set up price input and button
    const priceInput = document.getElementById('wine-price-input');
    const setPriceBtn = document.getElementById('set-price-btn');
    const currentPriceDisplay = document.getElementById('current-price-display');
    const basePriceReference = document.getElementById('base-price-reference');

    // Load saved price if available
    const savedPrice = localStorage.getItem('wineCustomPrice');
    if (savedPrice) {
        priceInput.value = savedPrice;
        currentPriceDisplay.textContent = `€${parseFloat(savedPrice).toFixed(2)}`;

        // Calculate and show a sample base price for reference
        const sampleWine = inventoryInstance.getItemsByState('Bottles')[0];
        if (sampleWine) {
            const basePrice = calculateWinePrice(sampleWine.quality, sampleWine);
            basePriceReference.textContent = `≈ €${basePrice.toFixed(2)} based on quality and characteristics`;
        }
    }

    // Set up event listener for price button
    setPriceBtn.addEventListener('click', () => {
        const price = parseFloat(priceInput.value);
        if (!isNaN(price) && price >= 0) {
            localStorage.setItem('wineCustomPrice', price);
            currentPriceDisplay.textContent = `€${price.toFixed(2)}`;

            // Regenerate orders with the new price
            displayWineOrders();

            // Update the display of wine cellar inventory with new prices
            displayWineCellarInventory();
        } else {
            alert('Please enter a valid price');
        }
    });

    displayWineCellarInventory();
    displayWineOrders();
}

export function displayWineCellarInventory() {
    const tableBody = document.getElementById('winecellar-table-body');
    tableBody.innerHTML = '';

    const bottledWines = inventoryInstance.getItemsByState('Bottles');
    const customPrice = parseFloat(localStorage.getItem('wineCustomPrice'));

    bottledWines.forEach(wine => {
        const row = document.createElement('tr');
        const displayInfo = wine.getDisplayInfo();
        const calculatedPrice = calculateWinePrice(wine.quality, wine);
        const sellingPrice = customPrice || 0; // Use custom price if set, otherwise 0

        // Calculate price comparison for visual indicator
        let priceComparison = '';
        if (customPrice) {
            const priceDiff = ((sellingPrice - calculatedPrice) / calculatedPrice) * 100;
            if (priceDiff > 10) {
                priceComparison = '<span class="color-class-0">(High)</span>';
            } else if (priceDiff < -10) {
                priceComparison = '<span class="color-class-7">(Low)</span>';
            }
        }

        row.innerHTML = `
            <td><strong>${displayInfo.name}</strong></td>
            <td>${displayInfo.storage}</td>
            <td>${formatNumber(displayInfo.amount)} bottles</td>
            <td>${formatQualityDisplay(wine.quality)}</td>
            <td style="text-align: center;"><strong>Bulk Sale</strong></td>
            <td>€${sellingPrice.toFixed(2)} ${priceComparison}</td>
            <td><button class="btn-alternative sell-wine-btn" data-wine-name="${wine.resource.name}" data-wine-vintage="${wine.vintage}" data-wine-storage="${wine.storage}" ${!customPrice ? 'disabled' : ''}>Sell</button></td>
        `;

        const sellButton = row.querySelector('.sell-wine-btn');
        if (customPrice) {
            sellButton.addEventListener('click', () => {
                sellWines(sellButton.dataset.wineName);
                displayWineCellarInventory();
            });
        } else {
            sellButton.title = "Set a price to enable selling";
        }

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

    // Only load orders if a price is set
    const customPrice = localStorage.getItem('wineCustomPrice');

    if (customPrice) {
        currentOrders = loadWineOrders();

        // If no orders yet, try to generate some based on the price
        if (currentOrders.length === 0) {
            for (let i = 0; i < 3; i++) {
                if (shouldGenerateWineOrder(parseFloat(customPrice))) {
                    // This will add orders to storage
                    sellOrderWine(i); //Added to fix the error
                }
            }
            currentOrders = loadWineOrders();
        }

        setupEventListeners();
        populateResourceFilter();
        refreshDisplay();
    } else {
        // Display message if no price is set
        wineOrdersTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="alert alert-info">
                        Please set a wine price above to generate orders
                    </div>
                </td>
            </tr>
        `;
    }
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

            <!-- Wine Cellar Inventory Section -->
            <section id="inventory-section" class="overlay-section card mb-4">
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
    `;
}