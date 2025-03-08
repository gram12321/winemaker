
import { formatNumber, formatQualityDisplay  } from '/js/utils.js';
import { calculateWinePrice, sellWines, sellOrderWine, setCustomWinePrice, getCustomWinePrice, hasCustomPrice } from '/js/sales.js';
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
                            <th>Base Price</th>
                            <th>Your Price</th>
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
            </div>
        </section>
    `;
}

// Display wine cellar inventory in the sales overlay
export function displayWineCellarInventory() {
    const bottledWines = inventoryInstance.getItemsByState('Bottles');
    const tableBody = document.getElementById('winecellar-table-body');

    if (!tableBody) return;

    tableBody.innerHTML = '';

    bottledWines.forEach(wine => {
        const basePrice = calculateWinePrice(wine.quality, wine);
        const row = document.createElement('tr');
        const customPrice = getCustomWinePrice(wine.resource.name, wine.vintage, wine.storage) || '';
        
        row.innerHTML = `
            <td><strong>${wine.fieldName}, ${wine.resource.name}, ${wine.vintage}</strong></td>
            <td>${wine.storage}</td>
            <td>${wine.amount} bottles</td>
            <td>${formatQualityDisplay(wine.quality)}</td>
            <td>€${basePrice.toFixed(2)}</td>
            <td>
                <input type="number" 
                       class="price-input form-control" 
                       value="${customPrice}" 
                       min="0" 
                       step="0.01" 
                       data-wine-name="${wine.resource.name}" 
                       data-wine-vintage="${wine.vintage}" 
                       data-wine-storage="${wine.storage}"
                       placeholder="Set price">
            </td>
        `;

        tableBody.appendChild(row);
    });

    if (bottledWines.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="text-center">No bottled wine in inventory.</td>';
        tableBody.appendChild(row);
    }

    setupPriceInputListeners();
}

// Display wine orders in the sales overlay
export function displayWineOrders() {
    const wineOrders = loadWineOrders();
    const tableBody = document.getElementById('wine-orders-table-body');
    
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // Populate the wine type filter if not already done
    populateResourceFilter();

    // Get filter values
    const typeFilter = document.getElementById('type-filter')?.value || '';
    const resourceFilter = document.getElementById('resource-filter')?.value || '';

    // Apply filters
    const filteredOrders = wineOrders.filter(order => {
        return (typeFilter === '' || order.type === typeFilter) &&
               (resourceFilter === '' || order.resourceName === resourceFilter);
    });

    if (filteredOrders.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="text-center">No active wine orders.</td>';
        tableBody.appendChild(row);
        return;
    }

    filteredOrders.forEach((order, i) => {
        const originalIndex = wineOrders.findIndex(o => 
            o.resourceName === order.resourceName && 
            o.vintage === order.vintage && 
            o.amount === order.amount && 
            o.type === order.type
        );

        const row = document.createElement('tr');
        
        // Determine which icon to use based on order type
        const orderTypeIcon = order.type === "Engross Order" 
            ? '<img src="/assets/icon/icon_engrossorder.webp" alt="Engross Order" class="status-image"><br>'
            : '<img src="/assets/icon/icon_privateorder.webp" alt="Private Order" class="status-image"><br>';

        row.innerHTML = `
            <td style="text-align: center;"><strong>${orderTypeIcon}${order.type}</strong></td>
            <td><strong>${order.fieldName}</strong>, ${order.resourceName}, ${order.vintage}</td>
            <td>${formatQualityDisplay(order.quality)}</td>
            <td>${order.amount} Bottles</td>
            <td>€${order.wineOrderPrice.toFixed(2)}</td>
            <td>
                <button class="btn-alternative sell-order-btn" data-original-index="${originalIndex}">Sell</button>
                <button class="btn refuse-order-btn" data-original-index="${originalIndex}">Refuse</button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    setupOrderButtonListeners();
}

function populateResourceFilter() {
    const resourceFilter = document.getElementById('resource-filter');
    if (!resourceFilter) return;

    // Only repopulate if not already done (no options except the default)
    if (resourceFilter.options.length <= 1) {
        // Get all unique wine types from inventory and orders
        const bottledWines = inventoryInstance.getItemsByState('Bottles');
        const wineOrders = loadWineOrders();
        
        const uniqueWines = new Set();
        
        bottledWines.forEach(wine => uniqueWines.add(wine.resource.name));
        wineOrders.forEach(order => uniqueWines.add(order.resourceName));
        
        // Add options to filter
        Array.from(uniqueWines).sort().forEach(wineName => {
            const option = document.createElement('option');
            option.value = wineName;
            option.textContent = wineName;
            resourceFilter.appendChild(option);
        });
    }
}

function setupSalesOverlayEventListeners(overlay) {
    if (!overlay) return;

    displayWineCellarInventory();
    displayWineOrders();
    
    // Add event listeners for filters
    const typeFilter = document.getElementById('type-filter');
    const resourceFilter = document.getElementById('resource-filter');
    
    if (typeFilter) {
        typeFilter.addEventListener('change', displayWineOrders);
    }
    
    if (resourceFilter) {
        resourceFilter.addEventListener('change', displayWineOrders);
    }
}

// Set up listeners for price input fields
function setupPriceInputListeners() {
    document.querySelectorAll('.price-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const { wineVintage, wineName, wineStorage } = e.target.dataset;
            const price = parseFloat(e.target.value);

            if (!isNaN(price) && price >= 0) {
                setCustomWinePrice(wineName, parseInt(wineVintage), wineStorage, price);
            }
        });
    });
}

// Set up listeners for order buttons
function setupOrderButtonListeners() {
    // Sell buttons
    document.querySelectorAll('.sell-order-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const orderIndex = parseInt(e.target.dataset.originalIndex);
            sellOrderWine(orderIndex);
            displayWineOrders();
        });
    });
    
    // Refuse buttons
    document.querySelectorAll('.refuse-order-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const orderIndex = parseInt(e.target.dataset.originalIndex);
            const wineOrders = loadWineOrders();
            
            if (orderIndex >= 0 && orderIndex < wineOrders.length) {
                wineOrders.splice(orderIndex, 1);
                saveWineOrders(wineOrders);
                displayWineOrders();
            }
        });
    });
}
