// Import all necessary display functions
import { renderCompanyInfo } from './database/loadSidebar.js';
import { displayFarmland } from './overlays/mainpages/landoverlay.js';
import { displayWineCellarInventory, displayWineOrders } from './overlays/mainpages/salesoverlay.js';
import { displayStaff } from './staff.js';

// Central function to update all displays
export function updateAllDisplays() {
    try {
        renderCompanyInfo();
        displayFarmland();
        displayWineCellarInventory();
        displayStaff();
        displayWineOrders();
    } catch (error) {
        console.debug('Some display functions are not available in current context:', error);
    }
}