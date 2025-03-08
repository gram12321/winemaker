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
    <div class="overlay-container">
        <h2>Wine Cellar & Sales</h2>
        <div class="overlay-content">
            <section class="overlay-section">
                <h3>Bottled Wines</h3>
                <table class="overlay-table sortable-table">
                    <thead>
                        <tr>
                            <th data-sort="name" style="cursor: pointer">Wine ↕</th>
                            <th data-sort="storage" style="cursor: pointer">Storage ↕</th>
                            <th data-sort="amount" style="cursor: pointer">Amount ↕</th>
                            <th data-sort="quality" style="cursor: pointer">Quality ↕</th>
                            <th data-sort="basePrice" style="cursor: pointer">Base Price ↕</th>
                            <th>Selling Price</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="winecellar-table-body">
                    </tbody>
                </table>
            </section>

            <section class="overlay-section">
                <h3>Wine Orders</h3>
                <table class="overlay-table sortable-table">
                    <thead>
                        <tr>
                            <th data-sort="type" style="cursor: pointer">Order Type ↕</th>
                            <th data-sort="wine" style="cursor: pointer">Wine ↕</th>
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

export function displayWineOrders() {
    const tableBody = document.getElementById('wine-orders-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const wineOrders = loadWineOrders();
    if (!wineOrders || wineOrders.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="7">No wine orders available</td>`;
        tableBody.appendChild(emptyRow);
        return;
    }

    wineOrders.forEach((order, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.type}</td>
            <td>${order.resourceName} (${order.fieldName})</td>
            <td>${order.vintage}</td>
            <td>${formatQualityDisplay(order.quality)}</td>
            <td>${formatNumber(order.amount)} bottles</td>
            <td>€${order.wineOrderPrice.toFixed(2)}</td>
            <td>
                <button class="btn-alternative fulfill-order-btn" data-order-index="${index}">
                    Fulfill
                </button>
            </td>
        `;

        const fulfillButton = row.querySelector('.fulfill-order-btn');
        fulfillButton.addEventListener('click', () => {
            if (sellOrderWine(index)) {
                displayWineOrders();
                displayWineCellarInventory();
                updateAllDisplays();
            }
        });

        tableBody.appendChild(row);
    });
}

// Sort wine cellar inventory and orders tables based on selected column
document.addEventListener('click', function(e) {
    if (e.target.closest('th[data-sort]')) {
        const header = e.target.closest('th[data-sort]');
        const sortKey = header.dataset.sort;
        const tableBody = header.closest('table').querySelector('tbody');
        const rows = Array.from(tableBody.querySelectorAll('tr'));

        // Get the current sort direction
        const currentDirection = header.getAttribute('data-direction') || 'asc';
        const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';

        // Reset all headers
        header.closest('thead').querySelectorAll('th').forEach(th => {
            th.textContent = th.textContent.replace(' ↑', ' ↕').replace(' ↓', ' ↕');
            th.removeAttribute('data-direction');
        });

        // Update sort direction and icon
        header.setAttribute('data-direction', newDirection);
        header.textContent = header.textContent.replace(' ↕', newDirection === 'asc' ? ' ↑' : ' ↓');

        // Sort the rows
        rows.sort((a, b) => {
            let aValue, bValue;

            if (tableBody.id === 'winecellar-table-body') {
                switch(sortKey) {
                    case 'name':
                        aValue = a.querySelector('td:first-child').textContent;
                        bValue = b.querySelector('td:first-child').textContent;
                        break;
                    case 'storage':
                        aValue = a.querySelector('td:nth-child(2)').textContent;
                        bValue = b.querySelector('td:nth-child(2)').textContent;
                        break;
                    case 'amount':
                        aValue = parseFloat(a.querySelector('td:nth-child(3)').textContent.replace(/[^\d.-]/g, ''));
                        bValue = parseFloat(b.querySelector('td:nth-child(3)').textContent.replace(/[^\d.-]/g, ''));
                        break;
                    case 'quality':
                        aValue = parseFloat(a.querySelector('td:nth-child(4)').textContent.replace(/[^\d.-]/g, ''));
                        bValue = parseFloat(b.querySelector('td:nth-child(4)').textContent.replace(/[^\d.-]/g, ''));
                        break;
                    case 'basePrice':
                        aValue = parseFloat(a.querySelector('td:nth-child(5)').textContent.replace(/[^\d.-]/g, ''));
                        bValue = parseFloat(b.querySelector('td:nth-child(5)').textContent.replace(/[^\d.-]/g, ''));
                        break;
                }
            } else if (tableBody.id === 'wine-orders-table-body') {
                switch(sortKey) {
                    case 'type':
                        aValue = a.querySelector('td:first-child').textContent;
                        bValue = b.querySelector('td:first-child').textContent;
                        break;
                    case 'wine':
                        aValue = a.querySelector('td:nth-child(2)').textContent;
                        bValue = b.querySelector('td:nth-child(2)').textContent;
                        break;
                    case 'vintage':
                        aValue = parseInt(a.querySelector('td:nth-child(3)').textContent);
                        bValue = parseInt(b.querySelector('td:nth-child(3)').textContent);
                        break;
                    case 'quality':
                        aValue = parseFloat(a.querySelector('td:nth-child(4)').textContent.replace(/[^\d.-]/g, ''));
                        bValue = parseFloat(b.querySelector('td:nth-child(4)').textContent.replace(/[^\d.-]/g, ''));
                        break;
                    case 'amount':
                        aValue = parseFloat(a.querySelector('td:nth-child(5)').textContent.replace(/[^\d.-]/g, ''));
                        bValue = parseFloat(b.querySelector('td:nth-child(5)').textContent.replace(/[^\d.-]/g, ''));
                        break;
                    case 'wineOrderPrice':
                        aValue = parseFloat(a.querySelector('td:nth-child(6)').textContent.replace(/[^\d.-]/g, ''));
                        bValue = parseFloat(b.querySelector('td:nth-child(6)').textContent.replace(/[^\d.-]/g, ''));
                        break;
                }
            }

            // Compare values
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return newDirection === 'asc' ? aValue - bValue : bValue - aValue;
            } else {
                return newDirection === 'asc' 
                    ? aValue.toString().localeCompare(bValue.toString())
                    : bValue.toString().localeCompare(aValue.toString());
            }
        });

        // Reorder the rows in the table
        rows.forEach(row => tableBody.appendChild(row));
    }
});