import { formatNumber, formatQualityDisplay  } from '/js/utils.js';
import { calculateWinePrice, shouldGenerateWineOrder } from '/js/sales.js';
import { inventoryInstance } from '/js/resource.js';
import { sellWines, sellOrderWine } from '/js/sales.js';
import { loadWineOrders, saveWineOrders } from '/js/database/adminFunctions.js';
import { showMainViewOverlay } from '/js/overlays/overlayUtils.js';
import { updateAllDisplays } from '/js/displayManager.js';

// Display the main sales overlay with wine cellar inventory and orders
export function showSalesOverlay() {
    const overlay = showMainViewOverlay(createSalesOverlayHTML());
    setupSalesOverlayEventListeners(overlay);
}

// Create HTML for the sales overlay
export function createSalesOverlayHTML() {
    return `
        <div class="mainview-overlay-content">
            <h3>Sales</h3>

            <!-- Price Setting Section -->
            <section id="price-setting-section" class="overlay-section card mb-4 price-setting-container">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Set Wine Price</h3>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label for="wine-price-input">Set your bottle price (€):</label>
                        <input type="number" class="form-control" id="wine-price-input" min="1" step="0.1" placeholder="Enter price">
                        <small class="form-text">Set a price to start selling your wine.</small>
                    </div>
                    <div class="mt-3">
                        <p>Current price: <span id="current-price-display">Not set</span></p>
                        <p>Base price reference: <span id="base-price-reference">Calculating...</span></p>
                    </div>
                    <button class="btn btn-success" id="set-price-btn">Set Price</button>
                </div>
            </section>

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
                                <th>Sale</th>
                            </tr>
                        </thead>
                        <tbody id="winecellar-table-body">
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Wine Orders Section -->
            <section id="orders-section" class="overlay-section card">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Wine Orders</h3>
                </div>
                <div class="card-body">
                    <table class="table overlay-table">
                        <thead>
                            <tr>
                                <th>Wine</th>
                                <th>Order Type</th>
                                <th>Amount</th>
                                <th>Quality</th>
                                <th>Price Per Bottle</th>
                                <th>Total Value</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="wine-orders-table-body">
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    `;
}

// Setup event listeners for the sales overlay
function setupSalesOverlayEventListeners(overlay) {
    displayWineCellarInventory();
    displayWineOrders();
    setupPriceSettingUI(overlay);
}

function setupPriceSettingUI(overlay) {
    const winePriceInput = overlay.querySelector('#wine-price-input');
    const currentPriceDisplay = overlay.querySelector('#current-price-display');
    const basePriceReference = overlay.querySelector('#base-price-reference');
    const setPriceBtn = overlay.querySelector('#set-price-btn');

    // Load current price if exists
    const savedPrice = localStorage.getItem('wineCustomPrice');
    if (savedPrice) {
        currentPriceDisplay.textContent = `€${parseFloat(savedPrice).toFixed(2)}`;
        winePriceInput.value = savedPrice;
    }

    // Calculate a reference base price from bottled wines
    const bottledWines = inventoryInstance.getItemsByState('Bottles');
    if (bottledWines.length > 0) {
        // Find the average base price of all bottled wines
        let totalBasePrice = 0;
        let wineCount = 0;

        bottledWines.forEach(wine => {
            const basePrice = calculateWinePrice(wine.quality, wine);
            if (basePrice > 0) {
                totalBasePrice += basePrice;
                wineCount++;
            }
        });

        if (wineCount > 0) {
            const avgBasePrice = totalBasePrice / wineCount;
            basePriceReference.textContent = `€${avgBasePrice.toFixed(2)}`;
        } else {
            basePriceReference.textContent = "No reference available";
        }
    } else {
        basePriceReference.textContent = "No bottled wines available";
    }

    // Set price button event
    if (setPriceBtn) {
        setPriceBtn.addEventListener('click', () => {
            const price = parseFloat(winePriceInput.value);
            if (!isNaN(price) && price > 0) {
                localStorage.setItem('wineCustomPrice', price);
                currentPriceDisplay.textContent = `€${price.toFixed(2)}`;
                // Check if we should generate a wine order based on new price
                if (shouldGenerateWineOrder(price)) {
                    console.log("Generated wine order based on new price");
                }
            } else {
                currentPriceDisplay.textContent = "Not set";
                localStorage.removeItem('wineCustomPrice');
            }
        });
    }
}

// Display bottled wines in inventory
export function displayWineCellarInventory() {
    const tableBody = document.getElementById('winecellar-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    const bottledWines = inventoryInstance.getItemsByState('Bottles');

    if (bottledWines.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" class="text-center">No bottled wines in inventory</td>`;
        tableBody.appendChild(row);
        return;
    }

    bottledWines.forEach((wine) => {
        const row = document.createElement('tr');

        // Calculate the potential price of this wine
        const winePrice = calculateWinePrice(wine.quality, wine);

        row.innerHTML = `
            <td>${wine.resource.name} (${wine.vintage})</td>
            <td>${wine.storage}</td>
            <td>${wine.amount}</td>
            <td>${formatQualityDisplay(wine.quality)}</td>
            <td>Individual</td>
            <td>
                <button class="btn btn-secondary btn-sm sell-wine-btn" 
                        data-resource="${wine.resource.name}">
                    Sell 1 Bottle
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Attach event listeners to sell buttons
    const sellButtons = document.querySelectorAll('.sell-wine-btn');
    sellButtons.forEach((button) => {
        button.addEventListener('click', function() {
            const resourceName = this.getAttribute('data-resource');
            sellWines(resourceName);
            displayWineCellarInventory();
            displayWineOrders();
        });
    });
}

// Display wine orders
export function displayWineOrders() {
    const ordersTableBody = document.getElementById('wine-orders-table-body');
    if (!ordersTableBody) return;

    ordersTableBody.innerHTML = '';

    const wineOrders = loadWineOrders();

    if (wineOrders.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" class="text-center">No wine orders available</td>`;
        ordersTableBody.appendChild(row);
        return;
    }

    wineOrders.forEach((order) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.resource}</td>
            <td>${order.vintage}</td>
            <td>${formatQualityDisplay(order.quality)}</td>
            <td>${formatNumber(order.price, 2)}€</td>
            <td>${order.amount}</td>
            <td>${order.orderType}</td>
            <td>
                <button class="btn btn-success btn-sm sell-order-btn" 
                        data-order-id="${order.id}">
                    Sell
                </button>
            </td>
        `;
        ordersTableBody.appendChild(row);
    });

    // Attach event listeners to sell order buttons
    const sellOrderButtons = document.querySelectorAll('.sell-order-btn');
    sellOrderButtons.forEach((button) => {
        button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            sellOrderWine(orderId);
            displayWineCellarInventory();
            displayWineOrders();
            updateAllDisplays();
        });
    });
}