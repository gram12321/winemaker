
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
    } catch (error) {
        console.debug('Some display functions are not available in current context:', error);
    }
}

// Import all necessary display functions
import { renderCompanyInfo } from './database/loadSidebar.js';
import { displayFarmland } from './overlays/mainpages/landoverlay.js';
import { displayWineCellarInventory, displayWineOrders } from './overlays/mainpages/salesoverlay.js';
import { displayStaff } from './staff.js';
import { updateBuildingCards, updateBuildButtonStates } from './buildings.js';
import { populateInventoryTables } from './overlays/mainpages/inventoryoverlay.js';
