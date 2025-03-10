// Import all necessary display functions
import { renderCompanyInfo } from './company.js';
import { displayFarmland } from './overlays/mainpages/landoverlay.js';
import { displayWineCellarInventory, displayWineOrders } from './overlays/mainpages/salesoverlay.js';
import { displayStaff } from './staff.js';
import { updateBuildingCards, updateBuildButtonStates } from './overlays/mainpages/buildingsoverlay.js';
import { populateInventoryTables } from './overlays/mainpages/inventoryoverlay.js';
import { updateVineyardTable } from './overlays/mainpages/vineyardoverlay.js';
import { updateWineryStorage } from './overlays/mainpages/wineryoverlay.js';
import { loadCashFlow, updateIncomeStatement } from './finance.js';
import { setupTeamSections, updateTeamMembersSection } from './overlays/mainpages/staffoverlay.js';
import { updateUpgradesList } from './overlays/mainpages/financeoverlay.js';
import { updateAllImporterRelationships } from './classes/importerClass.js';
import { refreshImporterRelationships } from './overlays/mainpages/winepediaoverlay.js';


// Central function to update all displays
export function updateAllDisplays() {

    // Import all necessary display functions
    try {
        // Update importer relationships based on current company prestige
        updateAllImporterRelationships();
        
        // Refresh the importer relationships in the Winepedia if it's open
        refreshImporterRelationships();
        
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
            // Update team sections if the overlay is open
            const teamSection = document.querySelector('.mainview-overlay-content');
            if (teamSection && typeof setupTeamSections === 'function') {
                setupTeamSections(teamSection);
                updateTeamMembersSection();
            }
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

        // Update upgrade list
        if (document.getElementById('upgrade-list') && typeof updateUpgradesList === 'function') {
            updateUpgradesList();
        }
    } catch (error) {
        console.debug('Some display functions are not available in current context:', error);
    }
}

