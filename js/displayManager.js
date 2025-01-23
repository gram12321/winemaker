
// Central function to update all displays
export function updateAllDisplays() {
    // Company info in sidebar
    if (typeof renderCompanyInfo === 'function') {
        renderCompanyInfo();
    }

    // Farmland display
    if (typeof displayFarmland === 'function') {
        displayFarmland();
    }

    // Wine cellar inventory
    if (typeof displayWineCellarInventory === 'function') {
        displayWineCellarInventory();
    }

    // Staff display
    if (typeof displayStaff === 'function') {
        displayStaff();
    }

    // Wine orders
    if (typeof displayWineOrders === 'function') {
        displayWineOrders();
    }
}

// Import all necessary display functions
import { renderCompanyInfo } from './database/loadSidebar.js';
import { displayFarmland } from './overlays/mainpages/landoverlay.js';
import { displayWineCellarInventory, displayWineOrders } from './overlays/mainpages/salesoverlay.js';
import { displayStaff } from './staff.js';
