
// Central function to update all displays
export function updateAllDisplays() {
    // Import all necessary display functions
    try {
        // Company info in sidebar
        if (typeof renderCompanyInfo === 'function' && document.getElementById('companyInfo')) {
            renderCompanyInfo();
        }

        // Farmland display
        if (typeof displayFarmland === 'function' && document.getElementById('vineyard-table-container')) {
            displayFarmland();
        }

        // Wine cellar inventory and orders
        if (document.getElementById('winecellar-table-body')) {
            updateWineCellarDisplay();
        }
        if (document.getElementById('wine-orders-table-body')) {
            updateWineOrdersDisplay();
        }

        // Staff display
        if (typeof displayStaff === 'function' && document.getElementById('staff-entries')) {
            displayStaff();
        }

        // Wine orders
        if (typeof displayWineOrders === 'function' && document.getElementById('wine-orders-table-body')) {
            displayWineOrders();
        }

        // Vineyard table
        if (typeof updateVineyardTable === 'function') {
            updateVineyardTable();
        }

        // Building displays
        if (typeof updateBuildingCards === 'function') {
            updateBuildingCards();
        }
        if (typeof updateBuildButtonStates === 'function') {
            updateBuildButtonStates();
        }
    } catch (error) {
        console.debug('Some display functions are not available in current context:', error);
    }
}

// Import all necessary display functions
import { renderCompanyInfo } from './database/loadSidebar.js';
import { displayFarmland } from './overlays/mainpages/landoverlay.js';
import { displayStaff } from './staff.js';
import { inventoryInstance } from './resource.js';
import { formatNumber, formatQualityDisplay } from './utils.js';
import { calculateWinePrice, sellWines, sellOrderWine } from './sales.js';
import { loadWineOrders, saveWineOrders } from './database/adminFunctions.js';

function updateWineCellarDisplay() {
    const tableBody = document.getElementById('winecellar-table-body');
    if (!tableBody) return;
    
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
            <td style="text-align: center;"><strong><img src="/assets/icon/icon_privateorder.webp" alt="Available" class="status-image"> <br> ${wine.type || 'Private Order'}</strong></td>
            <td>€${sellingPrice.toFixed(2)}</td>
            <td><button class="btn-alternative sell-wine-btn" data-resource="${displayInfo.resource.name}">Sell</button></td>
        `;

        const sellButton = row.querySelector('.sell-wine-btn');
        sellButton.addEventListener('click', () => {
            const wineName = wine.name ? wine.name.split(', ')[1] : wine.resource.name;
            sellWines(wineName);
            updateAllDisplays();
        });

        tableBody.appendChild(row);
    });
}

function updateWineOrdersDisplay() {
    const tableBody = document.getElementById('wine-orders-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    const orders = loadWineOrders();

    orders.forEach((order, index) => {
        const row = document.createElement('tr');
        const quality = parseFloat(order.quality);
        
        const iconPath = order.type === "Private Order" ? '/assets/icon/icon_privateorder.webp' : '/assets/icon/icon_engrossorder.webp';
        const typeInfo = `<img src="${iconPath}" alt="${order.type}" class="status-image">`;

        row.innerHTML = `
            <td style="text-align: center;"><strong>${typeInfo}<br>${order.type}</strong></td>
            <td><strong>${order.fieldName || ''}</strong>, ${order.resourceName || ''}, ${order.vintage || ''}</td>
            <td>${formatQualityDisplay(quality)}</td>
            <td>${order.amount} Bottles</td>
            <td>€${formatNumber(order.wineOrderPrice, 2)}</td>
            <td>
                <button class="btn-alternative sell-order-btn" data-index="${index}">Sell</button>
                <button class="btn refuse-order-btn" data-index="${index}">Refuse</button>
            </td>
        `;

        const sellButton = row.querySelector('.sell-order-btn');
        sellButton.addEventListener('click', () => {
            if (sellOrderWine(index)) {
                updateAllDisplays();
            }
        });

        const refuseButton = row.querySelector('.refuse-order-btn');
        refuseButton.addEventListener('click', () => {
            const wineOrders = loadWineOrders();
            wineOrders.splice(index, 1);
            saveWineOrders(wineOrders);
            updateAllDisplays();
        });

        tableBody.appendChild(row);
    });
}
import { updateBuildingCards, updateBuildButtonStates } from './buildings.js';
import { createVineyardTable, setupVineyardEventListeners } from './overlays/mainpages/vineyardoverlay.js';
