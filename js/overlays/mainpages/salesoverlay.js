import { formatNumber, formatQualityDisplay  } from '/js/utils.js';
import { calculateWinePrice, sellOrderWine } from '/js/sales.js';
import { loadPendingContracts, fulfillContract, rejectContract } from '/js/contracts.js';
import { inventoryInstance } from '/js/resource.js';
import { loadWineOrders, saveWineOrders } from '/js/database/adminFunctions.js';
import { showMainViewOverlay } from '/js/overlays/overlayUtils.js';
import { updateAllDisplays } from '/js/displayManager.js';
import { WINE_ORDER_TYPES } from '/js/constants/constants.js';
import { showAssignWineOverlay } from '/js/overlays/assignWineOverlay.js';

// Display the main sales overlay with wine cellar inventory and orders
export function showSalesOverlay() {
    const overlay = showMainViewOverlay(createSalesOverlayHTML());
    setupSalesOverlayEventListeners(overlay);
}

function setupSalesOverlayEventListeners(overlay) {
    // Set up tab navigation
    const tabs = overlay.querySelectorAll('.sales-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.view;
            
            // Update active tab
            overlay.querySelectorAll('.sales-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show/hide content sections
            overlay.querySelectorAll('.sales-section').forEach(section => {
                section.style.display = section.id === `${target}-section` ? 'block' : 'none';
            });
            
            // If switching to contracts tab, load the contracts
            if (target === 'contracts') {
                displayContractsTab();
            }
        });
    });

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
        const sellingPrice = calculateWinePrice(wine.quality, wine);

        row.innerHTML = `
            <td><strong>${displayInfo.name}</strong></td>
            <td>${displayInfo.storage}</td>
            <td>${formatNumber(displayInfo.amount)} bottles</td>
            <td>${formatQualityDisplay(wine.quality)}</td>
            <td>
                <div class="input-group input-group-sm">
                    <span class="input-group-text">€</span>
                    <input type="number" class="form-control price-input" min="0.01" step="0.01" placeholder="Enter price" 
                           data-base-price="${sellingPrice.toFixed(2)}" value="${wine.customPrice ? wine.customPrice.toFixed(2) : ''}">
                </div>
            </td>
            <td>€${sellingPrice.toFixed(2)}</td>
            <td>
                <button class="btn-alternative set-price-btn" 
                        data-wine-name="${wine.resource.name}" 
                        data-wine-vintage="${wine.vintage}" 
                        data-wine-storage="${wine.storage}"
                        data-wine-field="${wine.fieldName}">
                    Set Price
                </button>
            </td>
        `;

        const priceInput = row.querySelector('.price-input');
        const setPriceButton = row.querySelector('.set-price-btn');
        
        setPriceButton.addEventListener('click', () => {
            const price = parseFloat(priceInput.value);
            if (!isNaN(price) && price > 0) {
                // Save the custom price and update the display
                const wineItem = inventoryInstance.items.find(item => 
                    item.resource.name === setPriceButton.dataset.wineName && 
                    item.vintage === parseInt(setPriceButton.dataset.wineVintage) &&
                    item.storage === setPriceButton.dataset.wineStorage &&
                    item.fieldName === setPriceButton.dataset.wineField
                );
                if (wineItem) {
                    wineItem.customPrice = price;
                    inventoryInstance.save();
                    displayWineCellarInventory();
                }
            } else {
                alert("Please enter a valid price.");
            }
        });

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
                // Refresh the wine orders display after successful sale
                displayWineOrders();
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
            
            <!-- Tab Navigation -->
            <div class="d-flex flex-column">
                <div class="btn-group mb-4">
                    <button class="btn btn-outline-primary sales-tab active" data-view="cellar">Wine Cellar</button>
                    <button class="btn btn-outline-primary sales-tab" data-view="orders">Orders</button>
                    <button class="btn btn-outline-primary sales-tab" data-view="contracts">Contracts</button>
                </div>
            </div>

            <!-- Wine Cellar Inventory Section -->
            <section id="cellar-section" class="sales-section overlay-section card mb-4">
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
            <section id="orders-section" class="sales-section overlay-section card mb-4" style="display: none;">
                <img src="/assets/pic/sales_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Wine Sales">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Wine Orders</h3>
                    <div class="filters d-flex gap-2">
                        <select id="type-filter" class="form-control form-control-sm d-inline-block w-auto">
                            <option value="">All Types</option>
                            ${Object.keys(WINE_ORDER_TYPES).map(type => `<option value="${type}">${type}</option>`).join('')}
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

            <!-- Contracts Section -->
            <section id="contracts-section" class="sales-section overlay-section card mb-4" style="display: none;">
                <img src="/assets/pic/sales_dalle.webp" class="card-img-top process-image mx-auto d-block" alt="Wine Contracts">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Importer Contracts</h3>
                </div>
                <div class="card-body" id="contracts-tab-content">
                    <!-- Contracts content will be loaded here -->
                </div>
            </section>
        </div>
    `;
}

// Function to display the contracts tab content
export function displayContractsTab() {
    const contractsTabContent = document.getElementById('contracts-tab-content');
    if (!contractsTabContent) return;
    
    // Clear existing content
    contractsTabContent.innerHTML = '';
    
    // Load pending contracts
    const pendingContracts = loadPendingContracts();
    
    if (pendingContracts.length === 0) {
        contractsTabContent.innerHTML = `
            <div class="alert alert-info text-center">
                <p>No pending contracts available.</p>
                <p class="small mt-2">Contracts are offered by importers based on your reputation and relationship. Improve your standing by selling quality wines!</p>
            </div>
        `;
        return;
    }
    
    // Create section for pending contracts
    const contractsTable = document.createElement('div');
    contractsTable.className = 'table-responsive';
    contractsTable.innerHTML = `
        <table class="table overlay-table">
            <thead>
                <tr>
                    <th>Importer</th>
                    <th>Requirements</th>
                    <th>Amount</th>
                    <th>Price/Bottle</th>
                    <th>Total Value</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="contracts-table-body">
                <!-- Contract rows will be inserted here -->
            </tbody>
        </table>
    `;
    
    contractsTabContent.appendChild(contractsTable);
    const tableBody = document.getElementById('contracts-table-body');
    
    // Populate the table with contracts
    pendingContracts.forEach((contract, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <span class="badge bg-secondary">${contract.importerType}</span><br>
                <strong>${contract.importerCountry}</strong>
            </td>
            <td>
                <strong>Quality wine (min ${(contract.minQuality || 0.1) * 100}%)</strong><br>
                <small>Example: ${contract.resourceName}, Vintage ${contract.vintage}</small>
            </td>
            <td>${contract.amount} bottles</td>
            <td>€${contract.contractPrice.toFixed(2)}</td>
            <td>€${contract.totalValue.toFixed(2)}</td>
            <td>
                <button class="btn btn-success btn-sm mb-2 w-100 fulfill-contract-btn" data-index="${index}">Select Wine</button>
                <button class="btn btn-danger btn-sm w-100 reject-contract-btn" data-index="${index}">Reject</button>
            </td>
        `;
        
        // Add event handlers directly to buttons
        const fulfillBtn = row.querySelector('.fulfill-contract-btn');
        const rejectBtn = row.querySelector('.reject-contract-btn');
        
        fulfillBtn.addEventListener('click', () => {
            // Show the assign wine overlay instead of directly fulfilling the contract
            showAssignWineOverlay(contract, index);
        });
        
        rejectBtn.addEventListener('click', () => {
            if (rejectContract(index)) {
                displayContractsTab();
            }
        });
        
        tableBody.appendChild(row);
    });
    
    // Show maximum contracts info
    contractsTabContent.insertAdjacentHTML('afterbegin', `
        <div class="alert alert-secondary mb-3">
            <strong>Contract Limit:</strong> ${pendingContracts.length}/3 pending contracts
        </div>
    `);
}

// Setup event listeners for contracts tab
function setupSalesTabs() {
    const tabs = document.querySelectorAll('.sales-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.view;
            
            // Update active tab
            document.querySelectorAll('.sales-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show/hide content sections
            document.querySelectorAll('.sales-section').forEach(section => {
                section.style.display = section.id === `${target}-section` ? 'block' : 'none';
            });
            
            // If switching to contracts tab, load the contracts
            if (target === 'contracts') {
                displayContractsTab();
            }
        });
    });
}
