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
        <h3>Sales</h3>

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
            <img src="/assets/pic/wineorders_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Wine Orders">
            <div class="card-header text-white">
                <h3 class="h5 mb-0">Wine Orders</h3>
            </div>
            <div class="card-body">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Wine</th>
                            <th>Quantity</th>
                            <th>Quality</th>
                            <th>Price</th>
                            <th>Total</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="orders-table-body">
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

        const priceInput = document.createElement('div');
        priceInput.className = 'input-group';
        priceInput.innerHTML = `
            <span class="input-group-text">€</span>
            <input type="number" 
                   class="form-control price-input" 
                   placeholder="Set Price" 
                   min="0" 
                   step="0.01" 
                   data-wine-name="${wine.resource.name}" 
                   data-wine-vintage="${wine.vintage}" 
                   data-wine-storage="${wine.storage}" 
                   value="${getCustomWinePrice(wine.resource.name, wine.vintage, wine.storage) || ''}">
        `;

        row.innerHTML = `
            <td>${wine.resource.name} ${wine.vintage}</td>
            <td>${wine.storage || 'Unknown'}</td>
            <td>${wine.amount}</td>
            <td>${formatQualityDisplay(wine.quality)}</td>
            <td>€${basePrice.toFixed(2)}</td>
            <td></td>
        `;

        const actionCell = row.cells[5];
        actionCell.appendChild(priceInput);

        tableBody.appendChild(row);
    });

    setupPriceInputListeners();
}

// Display wine orders in the sales overlay
export function displayWineOrders() {
    const wineOrders = loadWineOrders();
    const tableBody = document.getElementById('orders-table-body');

    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (wineOrders.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" class="text-center">No active wine orders.</td>';
        tableBody.appendChild(row);
        return;
    }

    wineOrders.forEach((order, index) => {
        const row = document.createElement('tr');
        const totalPrice = order.amount * order.wineOrderPrice;

        row.innerHTML = `
            <td>${order.type}</td>
            <td>${order.resourceName} ${order.vintage}</td>
            <td>${order.amount}</td>
            <td>${formatQualityDisplay(order.quality)}</td>
            <td>€${order.wineOrderPrice.toFixed(2)}</td>
            <td>€${totalPrice.toFixed(2)}</td>
            <td>
                <button class="btn-alternative fulfill-order-btn" data-order-index="${index}">
                    Fulfill
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    setupFulfillOrderListeners();
}

// Set up event listeners for the sales overlay
function setupSalesOverlayEventListeners(overlay) {
    if (!overlay) return;

    displayWineCellarInventory();
    displayWineOrders();
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

// Set up listeners for fulfill order buttons
function setupFulfillOrderListeners() {
    document.querySelectorAll('.fulfill-order-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const orderIndex = parseInt(e.target.dataset.orderIndex);
            sellOrderWine(orderIndex);
            displayWineOrders(); //refresh display after fulfilling order.
        });
    });
}