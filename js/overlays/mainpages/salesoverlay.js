import { formatNumber, getWineQualityCategory, getColorClass } from '/js/utils.js';
import { inventoryInstance } from '/js/resource.js';
import { sellWines, sellOrderWine } from '/js/sales.js';
import { loadWineOrders, saveWineOrders } from '/js/database/adminFunctions.js';

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
                            <th>Wine</th>
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
                <div class="filters mb-3">
                    <select id="type-filter" class="form-control d-inline-block w-auto mr-2">
                        <option value="">All Types</option>
                        <option value="Private Order">Private Order</option>
                        <option value="Engross Order">Engross Order</option>
                    </select>
                    <select id="resource-filter" class="form-control d-inline-block w-auto">
                        <option value="">All Wines</option>
                    </select>
                </div>
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Order Type</th>
                            <th>Wine</th>
                            <th>Quality</th>
                            <th data-sort="amount" style="cursor: pointer">Amount ↕</th>
                            <th data-sort="price" style="cursor: pointer">Offered Price ↕</th>
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
        const qualityDescription = getWineQualityCategory(wine.quality);
        const colorClass = getColorClass(wine.quality);
        const qualityDisplay = `${qualityDescription} <span class="${colorClass}">(${(wine.quality * 100).toFixed(0)}%)</span>`;

        row.innerHTML = `
            <td><strong>${wine.name}</strong></td>
            <td>${wine.storage}</td>
            <td>${formatNumber(wine.amount)} bottles</td>
            <td>${qualityDisplay}</td>
            <td style="text-align: center;"><strong><img src="/assets/icon/icon_privateorder.webp" alt="Available" class="status-image"> <br> ${wine.type || 'Private Order'}</strong></td>
            <td><button class="btn btn-success sell-wine-btn" data-resource="${wine.name.split(', ')[1]}">Sell</button></td>
        `;

        const sellButton = row.querySelector('.sell-wine-btn');
        sellButton.addEventListener('click', () => {
            const wineName = wine.name.split(', ')[1];
            sellWines(wineName);
            displayWineCellarInventory(); // Refresh the display
        });

        tableBody.appendChild(row);
    });
}

let currentOrders = [];
let sortDirection = { amount: 'asc', price: 'asc' };

function populateResourceFilter() {
    const resourceFilter = document.getElementById('resource-filter');
    const uniqueResources = [...new Set(currentOrders.map(order => order.resourceName))];
    resourceFilter.innerHTML = '<option value="">All Wines</option>';
    uniqueResources.forEach(resource => {
        resourceFilter.innerHTML += `<option value="${resource}">${resource}</option>`;
    });
}

function filterOrders(orders) {
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
        const aValue = sortKey === 'amount' ? parseFloat(a.amount) : parseFloat(a.wineOrderPrice);
        const bValue = sortKey === 'amount' ? parseFloat(b.amount) : parseFloat(b.wineOrderPrice);
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
}

function setupEventListeners() {
    // Setup filter listeners
    const typeFilter = document.getElementById('type-filter');
    const resourceFilter = document.getElementById('resource-filter');
    const newTypeFilter = typeFilter.cloneNode(true);
    const newResourceFilter = resourceFilter.cloneNode(true);
    
    typeFilter.parentNode.replaceChild(newTypeFilter, typeFilter);
    resourceFilter.parentNode.replaceChild(newResourceFilter, resourceFilter);
    
    newTypeFilter.addEventListener('change', refreshDisplay);
    newResourceFilter.addEventListener('change', refreshDisplay);

    // Setup sort listeners
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.onclick = () => {
            const sortKey = th.dataset.sort;
            sortDirection[sortKey] = sortDirection[sortKey] === 'asc' ? 'desc' : 'asc';
            refreshDisplay();
            return false;
        };
    });
}

function refreshDisplay() {
    let orders = filterOrders(currentOrders);
    const activeSortKey = Object.keys(sortDirection).find(key => sortDirection[key] !== null);
    if (activeSortKey) {
        orders = sortOrders(orders, activeSortKey, sortDirection[activeSortKey]);
    }
    displayFilteredOrders(orders);
}

function displayWineOrders() {
    const wineOrdersTableBody = document.getElementById('wine-orders-table-body');
    wineOrdersTableBody.innerHTML = '';
    currentOrders = loadWineOrders();

    setupEventListeners();
    populateResourceFilter();
    refreshDisplay();
}

function displayFilteredOrders(filteredOrders) {
    const wineOrdersTableBody = document.getElementById('wine-orders-table-body');
    wineOrdersTableBody.innerHTML = '';

    filteredOrders.forEach((order, index) => {
        const row = document.createElement('tr');
        const quality = parseFloat(order.quality);
        const qualityDescription = getWineQualityCategory(quality);
        const colorClass = getColorClass(quality);
        const qualityText = `${qualityDescription} <span class="${colorClass}">(${(quality * 100).toFixed(0)}%)</span>`;

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
            <td>${qualityText}</td>
            <td>${displayAmount}</td>
            <td>€${formatNumber(order.wineOrderPrice, 2)}</td>
            <td>
                <button class="btn btn-success sell-order-btn">Sell</button>
                <button class="btn btn-danger refuse-order-btn">Refuse</button>
            </td>
        `;

        const sellButton = row.querySelector('.sell-order-btn');
        sellButton.addEventListener('click', () => {
            sellOrderWine(index);
        });

        const refuseButton = row.querySelector('.refuse-order-btn');
        refuseButton.addEventListener('click', () => {
            const wineOrders = loadWineOrders();
            wineOrders.splice(index, 1);
            saveWineOrders(wineOrders);
            displayWineOrders();
        });

        wineOrdersTableBody.appendChild(row);
    });
}