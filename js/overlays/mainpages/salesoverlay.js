import { formatNumber, getWineQualityCategory, getColorClass } from '/js/utils.js';
import { inventoryInstance } from '/js/resource.js';
import { sellWines, sellOrderWine } from '/js/sales.js';
import { loadWineOrders } from '/js/database/adminFunctions.js';

export function showSalesOverlay() {
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    overlay.innerHTML = `
        <div class="mainview-overlay-content">
            <h3>Sales</h3>

            <!-- Wine Cellar Inventory Section -->
            <section class="my-4">
                <h3>Wine Cellar Inventory</h3>
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Resource</th>
                            <th>Storage</th>
                            <th>Amount</th>
                            <th>Quality</th>
                            <th>Order Type</th>
                            <th>Bulk Sales</th>
                        </tr>
                    </thead>
                    <tbody id="winecellar-table-body">
                    </tbody>
                </table>
            </section>

            <!-- Wine Orders Section -->
            <section class="my-4">
                <h3>Wine Orders</h3>
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Resource</th>
                            <th>Quality</th>
                            <th>Amount</th>
                            <th>Offered Price</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="wine-orders-table-body">
                    </tbody>
                </table>
            </section>
        </div>
    `;

    document.body.appendChild(overlay);
    overlay.style.display = 'block';

    displayWineCellarInventory();
    displayWineOrders();
}

function displayWineCellarInventory() {
    const tableBody = document.getElementById('winecellar-table-body');
    tableBody.innerHTML = '';

    const bottledWines = inventoryInstance.getBottledWines();

    bottledWines.forEach(wine => {
        const row = document.createElement('tr');
        const qualityDisplay = `<span class="${getColorClass(wine.quality)}">(${(wine.quality * 100).toFixed(0)}%)</span>`;

        row.innerHTML = `
            <td><strong>${wine.name}</strong></td>
            <td>${wine.storage}</td>
            <td>${formatNumber(wine.amount)} bottles</td>
            <td>${qualityDisplay}</td>
            <td style="text-align: center;"><strong><img src="/assets/icon/icon_privateorder.webp" alt="Available" class="status-image"> <br> Privat</strong></td>
            <td><button class="btn btn-success sell-wine-btn" data-resource="${wine.name.split(', ')[1]}">Sell</button></td>
        `;

        const sellButton = row.querySelector('.sell-wine-btn');
        sellButton.addEventListener('click', () => {
            sellWines(wine.resource.name);
            displayWineCellarInventory(); // Refresh the display
        });

        tableBody.appendChild(row);
    });
}

function displayWineOrders() {
    const wineOrdersTableBody = document.getElementById('wine-orders-table-body');
    wineOrdersTableBody.innerHTML = '';
    const wineOrders = loadWineOrders();

    wineOrders.forEach((order, index) => {
        const row = document.createElement('tr');
        const qualityDescription = getWineQualityCategory(order.quality);
        const colorClass = getColorClass(order.quality);
        const qualityText = `${qualityDescription} <span class="${colorClass}">(${order.quality.toFixed(2)})</span>`;

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
            <td>${typeInfo}</td>
            <td><strong>${order.fieldName || ''}</strong>, ${order.resourceName || ''}, ${order.vintage || ''}</td>
            <td>${qualityText}</td>
            <td>${displayAmount}</td>
            <td>€${formatNumber(order.wineOrderPrice, 2)}</td>
            <td><button class="btn btn-success sell-order-btn">Sell</button></td>
        `;

        const sellButton = row.querySelector('.sell-order-btn');
        sellButton.addEventListener('click', () => {
            sellOrderWine(index);
        });

        wineOrdersTableBody.appendChild(row);
    });
}