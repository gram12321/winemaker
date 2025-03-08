
import { formatNumber, formatQualityDisplay  } from '/js/utils.js';
import { calculateWinePrice, sellWines, sellOrderWine, setCustomWinePrice, getCustomWinePrice } from '/js/sales.js';
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
    <div class="row">
        <!-- Wine Cellar Inventory Section -->
        <section id="winecellar-section" class="overlay-section card mb-4">
            <img src="/assets/pic/winecellar_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Wine Cellar">
            <div class="card-header text-white">
                <h3 class="h5 mb-0">Wine Cellar Inventory</h3>
            </div>
            <div class="card-body">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Wine</th>
                            <th>Storage</th>
                            <th>Quantity</th>
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
        const customPrice = getCustomWinePrice(wine.resource.name, wine.vintage, wine.storage) || '';

        row.innerHTML = `
            <td><strong>${displayInfo.name}</strong></td>
            <td>${displayInfo.storage}</td>
            <td>${formatNumber(displayInfo.amount)} bottles</td>
            <td>${formatQualityDisplay(wine.quality)}</td>
            <td>€${basePrice.toFixed(2)}</td>
            <td>
                <div class="input-group input-group-sm">
                    <span>€ </span>
                    <input type="number" class="form-control price-input" 
                           data-wine-name="${wine.resource.name}" 
                           data-wine-vintage="${wine.vintage}" 
                           data-wine-storage="${wine.storage}"
                           placeholder="Set price" 
                           step="0.01" min="0.01"
                           value="${customPrice}">
                </div>
            </td>
            <td>
                <button class="btn-alternative sell-wine-btn" 
                        data-wine-name="${wine.resource.name}" 
                        data-wine-vintage="${wine.vintage}" 
                        data-wine-storage="${wine.storage}"
                        ${customPrice ? '' : 'disabled'}>
                    Sell
                </button>
            </td>
        `;

        const priceInput = row.querySelector('.price-input');
        priceInput.addEventListener('change', (e) => {
            const price = parseFloat(e.target.value);
            const wineName = e.target.dataset.wineName;
            const wineVintage = parseInt(e.target.dataset.wineVintage);
            const wineStorage = e.target.dataset.wineStorage;
            
            if (!isNaN(price) && price > 0) {
                setCustomWinePrice(wineName, wineVintage, wineStorage, price);
                row.querySelector('.sell-wine-btn').disabled = false;
            } else {
                e.target.value = '';
                row.querySelector('.sell-wine-btn').disabled = true;
            }
        });

        const sellButton = row.querySelector('.sell-wine-btn');
        sellButton.addEventListener('click', () => {
            const wineName = sellButton.dataset.wineName;
            const wineVintage = parseInt(sellButton.dataset.wineVintage);
            const wineStorage = sellButton.dataset.wineStorage;
            
            sellWines(wineName, wineVintage, wineStorage);
            displayWineCellarInventory();
        });

        tableBody.appendChild(row);
    });
}

let currentOrders = [];
let currentSortKey = null;
let currentSortDirection = 'asc';

function sortOrders(orders, key, direction) {
    return [...orders].sort((a, b) => {
        if (direction === 'asc') {
            return a[key] - b[key];
        } else {
            return b[key] - a[key];
        }
    });
}

function filterOrders(orders) {
    const typeFilter = document.getElementById('type-filter').value;
    const resourceFilter = document.getElementById('resource-filter').value;
    
    return orders.filter(order => {
        return (typeFilter === '' || order.type === typeFilter) &&
               (resourceFilter === '' || order.resourceName === resourceFilter);
    });
}

function displayFilteredOrders(orders) {
    const tableBody = document.getElementById('wine-orders-table-body');
    tableBody.innerHTML = '';
    
    orders.forEach((order, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.type}</td>
            <td>${order.resourceName} ${order.vintage}</td>
            <td>${formatQualityDisplay(order.quality)}</td>
            <td>${formatNumber(order.amount)} bottles</td>
            <td>€${order.wineOrderPrice.toFixed(2)}</td>
            <td><button class="btn-alternative fulfill-order-btn" data-order-index="${index}">Fulfill</button></td>
        `;
        
        const fulfillButton = row.querySelector('.fulfill-order-btn');
        fulfillButton.addEventListener('click', (e) => {
            const orderIndex = parseInt(e.target.dataset.orderIndex);
            sellOrderWine(orderIndex);
            displayWineOrders();
        });
        
        tableBody.appendChild(row);
    });
}

function setupEventListeners() {
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            
            if (currentSortKey === key) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortKey = key;
                currentSortDirection = 'asc';
            }
            
            refreshDisplay();
        });
    });
    
    document.getElementById('type-filter').addEventListener('change', refreshDisplay);
    document.getElementById('resource-filter').addEventListener('change', refreshDisplay);
}

function populateResourceFilter() {
    const resourceFilter = document.getElementById('resource-filter');
    const resources = new Set();
    
    currentOrders.forEach(order => {
        resources.add(order.resourceName);
    });
    
    resourceFilter.innerHTML = '<option value="">All Wines</option>';
    
    resources.forEach(resource => {
        const option = document.createElement('option');
        option.value = resource;
        option.textContent = resource;
        resourceFilter.appendChild(option);
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
    currentOrders = loadWineOrders();

    setupEventListeners();
    populateResourceFilter();
    refreshDisplay();
}
