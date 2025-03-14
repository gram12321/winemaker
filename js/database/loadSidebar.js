import { showBuildingsOverlay } from '/js/overlays/mainpages/buildingsoverlay.js';
import { showAchievementOverlay } from '/js/overlays/mainpages/achievementoverlay.js';
import { showLandOverlay } from '/js/overlays/mainpages/landoverlay.js';
import { showInventoryOverlay } from '/js/overlays/mainpages/inventoryoverlay.js';
import { showStaffOverlay } from '/js/overlays/mainpages/staffoverlay.js';
import { showFinanceOverlay } from '/js/overlays/mainpages/financeoverlay.js';
import { showWineryOverlay } from '/js/overlays/mainpages/wineryoverlay.js';
import { showSalesOverlay } from '../overlays/mainpages/salesoverlay.js';
import { showMainOfficeOverlay } from '../overlays/mainpages/mainofficeoverlay.js';
import { incrementWeek } from '../endDay.js';
import { renderCompanyInfo  } from '../company.js';
import { showVineyardOverlay } from '../overlays/mainpages/vineyardoverlay.js';
import { showAdminOverlay } from '../overlays/mainpages/adminoverlay.js';
import { showSettingsOverlay } from '../overlays/mainpages/settingsoverlay.js';
import { saveCompanyInfo, clearLocalStorage } from '/js/database/initiation.js'; 


// Define a function to load and initialize the sidebar
export function initializeSidebar() {
    fetch('/html/sidebar.html')
        .then(response => response.text())
        .then(data => {
            // Initialize sidebar collapse state from localStorage
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

            // Add collapse functionality
            function toggleSidebar() {
                const sidebar = document.getElementById('sidebar-wrapper');
                const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
                if (isCurrentlyCollapsed) {
                    sidebar.classList.remove('collapsed');
                    document.body.classList.remove('sidebar-collapsed');
                    localStorage.setItem('sidebarCollapsed', 'false');
                } else {
                    sidebar.classList.add('collapsed');
                    document.body.classList.add('sidebar-collapsed');
                    localStorage.setItem('sidebarCollapsed', 'true');
                }
            }
            const sidebarWrapper = document.getElementById('sidebar-wrapper');
            if (sidebarWrapper) {
                // Extract only the inner content from the loaded HTML
                const temp = document.createElement('div');
                temp.innerHTML = data;
                const innerContent = temp.querySelector('#sidebar-wrapper').innerHTML;
                sidebarWrapper.innerHTML = innerContent;

                // Set initial collapse state
                if (localStorage.getItem('sidebarCollapsed') === 'true') {
                    sidebarWrapper.classList.add('collapsed');
                    document.body.classList.add('sidebar-collapsed');
                }

                // Add click handler for toggle button
                const toggleButton = sidebarWrapper.querySelector('.toggle-sidebar');
                if (toggleButton) {
                    toggleButton.addEventListener('click', toggleSidebar);
                }

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

                // Attach event listener to the settings link
                const settingsLink = document.getElementById('settings-link');
                if (settingsLink) {
                    settingsLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        showSettingsOverlay();
                    });
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
                        showMainOfficeOverlay(); // Updated to show the main office overlay
                    });
                } else {
                    console.error('Main link element not found');
                }

                // Attach event listener to the main link
                const achievementLink = document.getElementById('achievement-link');
                if (achievementLink) {
                    achievementLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        showAchievementOverlay(); // Updated to show the main office overlay
                    });
                } else {
                    console.error('Main link element not found');
                }

                // Attach event listener to the winepedia link after sidebar loads
                const winepediaLink = document.getElementById('winepedia-link');
                if (winepediaLink) {
                    winepediaLink.addEventListener('click', function(e) {
                        e.preventDefault(); // Prevent default navigation
                        showWinepediaOverlay(); // Show winepedia overlay
                    });
                } else {
                    console.error('Winepedia link element not found');
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

                // Create and append the Increment Week button
                const incrementWeekButton = document.createElement('button');
                incrementWeekButton.id = 'increment-week-btn';
                incrementWeekButton.className = 'btn btn-info';
                incrementWeekButton.addEventListener('click', incrementWeek);

                const menuGrid = document.querySelector('.menu-grid');
                if (menuGrid) {
                    menuGrid.insertAdjacentElement('afterend', incrementWeekButton);
                }
            } else {
                console.error("Sidebar wrapper element not found.");
            }
        })
        .catch(error => console.error('Error loading sidebar:', error));
}

import { showWinepediaOverlay } from '/js/overlays/mainpages/winepediaoverlay.js';