import { saveCompanyInfo, clearLocalStorage, loadFarmlands  } from './adminFunctions.js';
import { formatNumber } from '../utils.js'; // Ensure the correct path to the utils file
import { Farmland } from '../farmland.js'; // Ensure the correct path
import { showVineyardOverlay } from '../overlays/mainpages/vineyardoverlay.js';
import { showAdminOverlay } from '../overlays/mainpages/adminoverlay.js';
import { showBuildingsOverlay } from '/js/overlays/mainpages/buildingsoverlay.js';
import { showLandOverlay } from '/js/overlays/mainpages/landoverlay.js';
import { showInventoryOverlay } from '/js/overlays/mainpages/inventoryoverlay.js';
import { showStaffOverlay } from '/js/overlays/mainpages/staffoverlay.js';
import { showFinanceOverlay } from '/js/overlays/mainpages/financeoverlay.js';
import { showWineryOverlay } from '/js/overlays/mainpages/wineryoverlay.js';
import { showSalesOverlay } from '/js/overlays/mainpages/salesoverlay.js';
import { hideAllOverlays } from '/js/overlays/mainpages/hideOverlays.js';

// Define a function to load and initialize the sidebar
export function initializeSidebar() {
    fetch('/html/sidebar.html')
        .then(response => response.text())
        .then(data => {
            const sidebarWrapper = document.getElementById('sidebar-wrapper');
            if (sidebarWrapper) {
                sidebarWrapper.innerHTML = data;

                // Attach event listener to the vineyard link after sidebar loads
                const vineyardLink = document.getElementById('vineyard-link');
                if (vineyardLink) {
                    vineyardLink.addEventListener('click', function(e) {
                        e.preventDefault(); // Prevent default navigation
                        showVineyardOverlay(); // Show vineyard overlay
                    });
                } else {
                    console.error('Vineyard link element not found');
                }

                // Attach event listener to the admin link after sidebar loads
                const adminLink = document.getElementById('admin-link');
                if (adminLink) {
                    adminLink.addEventListener('click', function(e) {
                        e.preventDefault(); // Prevent default navigation
                        showAdminOverlay(); // Show admin overlay
                    });
                } else {
                    console.error('Admin link element not found');
                }

                // Attach event listener to the buildings link after sidebar loads
                const buildingsLink = document.getElementById('buildings-link');
                if (buildingsLink) {
                    buildingsLink.addEventListener('click', function(e) {
                        e.preventDefault(); // Prevent default navigation
                        showBuildingsOverlay(); // Show buildings overlay
                    });
                } else {
                    console.error('Buildings link element not found');
                }

                // Attach event listener to the land link after sidebar loads
                const landLink = document.getElementById('land-link');
                if (landLink) {
                    landLink.addEventListener('click', function(e) {
                        e.preventDefault(); // Prevent default navigation
                        showLandOverlay(); // Show land overlay
                    });
                } else {
                    console.error('Land link element not found');
                }

                // Attach event listener to the inventory link after sidebar loads
                const inventoryLink = document.getElementById('inventory-link');
                if (inventoryLink) {
                    inventoryLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        showInventoryOverlay();
                    });
                } else {
                    console.error('Inventory link element not found');
                }

                // Attach event listener to the staff link after sidebar loads
                const staffLink = document.getElementById('staff-link');
                if (staffLink) {
                    staffLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        showStaffOverlay();
                    });
                } else {
                    console.error('Staff link element not found');
                }

                // Attach event listener to the finance link after sidebar loads
                const financeLink = document.getElementById('finance-link');
                if (financeLink) {
                    financeLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        showFinanceOverlay();
                    });
                } else {
                    console.error('Finance link element not found');
                }

                // Attach event listener to the winery link after sidebar loads
                const wineryLink = document.getElementById('winery-link');
                if (wineryLink) {
                    wineryLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        showWineryOverlay();
                    });
                } else {
                    console.error('Winery link element not found');
                }

                // Attach event listener to the sales link after sidebar loads
                const salesLink = document.getElementById('sales-link');
                if (salesLink) {
                    salesLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        showSalesOverlay();
                    });
                } else {
                    console.error('Sales link element not found');
                }

                // Attach event listener to the main link
                const mainLink = document.getElementById('main-link');
                if (mainLink) {
                    mainLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        hideAllOverlays();
                    });
                } else {
                    console.error('Main link element not found');
                }

                // Render company information
                renderCompanyInfo();

                // Attach logout event handler
                const logoutLink = document.getElementById('logout-link');
                if (logoutLink) {
                    logoutLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        saveCompanyInfo();
                        clearLocalStorage();
                        window.location.href = '../index.html';
                    });
                }
            } else {
                console.error("Sidebar wrapper element not found.");
            }
        })
        .catch(error => console.error('Error loading sidebar:', error));
}

export function applyPrestigeHit(amount) {
    // Retrieve the current prestige hit from localStorage
    let currentPrestigeHit = parseFloat(localStorage.getItem('currentPrestigeHit') || '0');

    // Add the specified amount to the current prestige hit
    currentPrestigeHit += amount;

    // Store the updated prestige hit back in localStorage
    localStorage.setItem('currentPrestigeHit', currentPrestigeHit.toString());
}

export function decayPrestigeHit() {
    // Retrieve the current prestige hit from localStorage
    let currentPrestigeHit = parseFloat(localStorage.getItem('currentPrestigeHit') || '0');

    // Decay the prestige hit by 10%
    currentPrestigeHit *= 0.9; // Apply the 10% decay factor

    // Store the updated prestige hit back in localStorage
    localStorage.setItem('currentPrestigeHit', currentPrestigeHit.toString());
}


export function calculateCompanyPrestige() {
    const money = parseFloat(localStorage.getItem('money') || '0');
    const moneyPrestige = money / 10000000;
    const farmlands = loadFarmlands();

    const totalFarmlandPrestige = farmlands.reduce((total, farmland) => {
        return total + (farmland.farmlandPrestige || 0);
    }, 0);

    const currentPrestigeHit = parseFloat(localStorage.getItem('currentPrestigeHit') || '0');

    const companyPrestige = moneyPrestige + totalFarmlandPrestige + currentPrestigeHit;

    localStorage.setItem('companyPrestige', companyPrestige.toString());

    return companyPrestige;
}

export function renderCompanyInfo() {
    // Calculate companyPrestige based on current money
    calculateCompanyPrestige();
    
    // Use the same data loading mechanism as loadExistingCompanyData
    const companyName = localStorage.getItem('companyName');
    const money = localStorage.getItem('money');
    const currentWeek = localStorage.getItem('week');
    const currentSeason = localStorage.getItem('season');
    const currentYear = localStorage.getItem('year');
    const companyPrestige = parseFloat(localStorage.getItem('companyPrestige') || '0');
    const companyInfoDiv = document.getElementById('companyInfo');

    if (companyInfoDiv) {
        companyInfoDiv.innerHTML = `
          <div class="company-name" title="Your Company Name">${companyName.charAt(0).toUpperCase() + companyName.slice(1)}</div>
          <div class="styled-line"></div>
          
          <div class="info-item" title="Current Game Date">
            <span class="info-label"><img src="/assets/icon/small/sun.png" alt="Date Icon" style="width:24px; height:24px; margin-left:8px; margin-right:8px;"></span>
            <span class="info-content">Week ${currentWeek}, ${currentSeason}, ${currentYear}</span>
          </div>
          
          <div class="info-item" title="Available Company Funds">
            <span class="info-label"><img src="/assets/icon/small/gold.png" alt="Money Icon" style="width:24px; height:24px; margin-left:8px; margin-right:8px;"></span>
            <span class="info-content">€ ${formatNumber(money, 0)}</span>
          </div>
          <div class="info-item" title="Company Prestige">
            <span class="info-label"><img src="/assets/icon/small/prestige.png" alt="Prestige Icon" style="width:24px; height:24px; margin-left:8px; margin-right:8px;"></span>
            <span class="info-content"> ${formatNumber(companyPrestige.toFixed(2), 0)}</span>
          </div>
          <div class="styled-line"></div>
        `;
    }

    const dropdownToggle = document.querySelector('#navbarDropdown');
    if (companyName && dropdownToggle) {
        dropdownToggle.textContent = companyName;
    }
}