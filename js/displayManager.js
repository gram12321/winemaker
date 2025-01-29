// Import all necessary display functions
import { renderCompanyInfo } from './company.js';
import { displayFarmland } from './overlays/mainpages/landoverlay.js';
import { displayWineCellarInventory, displayWineOrders } from './overlays/mainpages/salesoverlay.js';
import { displayStaff } from './staff.js';
import { updateBuildingCards, updateBuildButtonStates } from './buildings.js';
import { populateInventoryTables } from './overlays/mainpages/inventoryoverlay.js';
import { updateVineyardTable } from './overlays/mainpages/vineyardoverlay.js';
import { updateWineryStorage } from './overlays/mainpages/wineryoverlay.js';
import { loadCashFlow, updateIncomeStatement } from './finance.js';
import { updatePatentsList } from './overlays/mainpages/financeoverlay.js';

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

        // Wine cellar and orders displays
        if (typeof displayWineCellarInventory === 'function' && document.getElementById('winecellar-table-body')) {
            displayWineCellarInventory();
        }
        if (typeof displayWineOrders === 'function' && document.getElementById('wine-orders-table-body')) {
            displayWineOrders();
        }

        // Staff display
        if (typeof displayStaff === 'function' && document.getElementById('staff-entries')) {
            displayStaff();
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

        // Update inventory tables
        if (typeof populateInventoryTables === 'function' && 
            (document.getElementById('grape-storage-body') || 
             document.getElementById('must-storage-body') || 
             document.getElementById('wine-storage-body'))) {
            populateInventoryTables();
        }

        // Update winery storage tables
        if ((document.getElementById('grape-storage-table') || document.getElementById('must-storage-table')) && 
            typeof updateWineryStorage === 'function') {
            updateWineryStorage();
        }

        // Update finance displays
        if (document.getElementById('cash-flow-table') && typeof loadCashFlow === 'function') {
            loadCashFlow();
        }
        if (document.getElementById('weekly-income') && typeof updateIncomeStatement === 'function') {
            updateIncomeStatement();
        }

        // Update patents list
        if (document.getElementById('patents-list') && typeof updatePatentsList === 'function') {
            updatePatentsList();
        }
    } catch (error) {
        console.debug('Some display functions are not available in current context:', error);
    }
}

