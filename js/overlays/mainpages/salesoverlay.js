
import { formatNumber, getWineQualityCategory, getColorClass } from '/js/utils.js';
//import { inventoryInstance, displayInventory } from '/js/resource.js';
import { sellWines, sellOrderWine } from '/js/sales.js';
import { loadWineOrders } from '/js/database/adminFunctions.js';

export function showSalesOverlay() {
    // Remove any existing instances of the overlay
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create overlay element
    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    // Create content for the overlay
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
                            <th>Amount</th>
                            <th>Quality</th>
                            <th>Status</th>
                            <th>Action</th>
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
                        </tr>
                    </thead>
                    <tbody id="wine-orders-table-body">
                    </tbody>
                </table>
            </section>
        </div>
    `;

    // Append overlay to document body
    document.body.appendChild(overlay);
    overlay.style.display = 'block';

    // Display inventory and wine orders
    displayInventory(inventoryInstance, ['winecellar-table-body'], true);
    displayWineOrders();
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
