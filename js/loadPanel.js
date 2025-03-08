// overlays/mainpages/winekipedia.js
function createWineKipediaOverlayHTML() {
    return `
        <div id="winekipedia-overlay" class="overlay">
            <div class="overlay-content">
                <h2>WineKipedia</h2>
                <p>WineKipedia content will go here.</p>
            </div>
        </div>
    `;
}

function showWineKipediaOverlay() {
    const overlayHTML = createWineKipediaOverlayHTML();
    document.body.insertAdjacentHTML('beforeend', overlayHTML);
    setupWineKipediaEventListeners();
}

function setupWineKipediaEventListeners() {
    const overlay = document.getElementById('winekipedia-overlay');
    if (overlay) {
        // Add close button functionality (example)
        const closeButton = overlay.querySelector('.close-button'); // Assumes a close button is added to the HTML
        if(closeButton){
            closeButton.addEventListener('click', () => {
                overlay.remove();
            });
        }

        // Add other event listeners as needed
    }
}

export { showWineKipediaOverlay };



// main.js (or wherever your sidebar handling code is)
import { showSalesOverlay } from './overlays/mainpages/salesoverlay.js';
import { showMainOfficeOverlay } from './overlays/mainpages/mainofficeoverlay.js';
import { showVineyardOverlay } from './overlays/mainpages/vineyardoverlay.js';
import { showBuildingsOverlay } from './overlays/mainpages/buildingsoverlay.js';
import { showStaffOverlay } from './overlays/mainpages/staffoverlay.js';
import { showSettingsOverlay } from './overlays/mainpages/settingsoverlay.js';
import { showWineKipediaOverlay } from './overlays/mainpages/winekipedia.js';

function closeAllOverlays() {
    // Implement logic to close all existing overlays
    // ... (This function is assumed to exist elsewhere)
}


// Initialize Task Panel
function initializePanel() {
    return fetch('/html/panel.html')
        .then(response => response.text())
        .then(data => {
            const panelContainer = document.createElement('div');
            panelContainer.innerHTML = data;
            document.body.appendChild(panelContainer);

            // Add panel collapse functionality
            const toggleButton = document.querySelector('.toggle-panel');
            if (toggleButton) {
                toggleButton.addEventListener('click', () => {
                    const panel = document.getElementById('panel-wrapper');
                    if (panel) {
                        panel.classList.toggle('collapsed');
                        document.body.classList.toggle('panel-collapsed');
                        localStorage.setItem('panelCollapsed', panel.classList.contains('collapsed'));
                    }
                });
            }

            // Set initial collapse state from localStorage
            const panel = document.getElementById('panel-wrapper');
            if (panel && localStorage.getItem('panelCollapsed') === 'true') {
                panel.classList.add('collapsed');
            }

            // Dropdown menu items
            document.getElementById('sales-link').addEventListener('click', function() {
                closeAllOverlays();
                showSalesOverlay();
            });

            document.getElementById('office-link').addEventListener('click', function() {
                closeAllOverlays();
                showMainOfficeOverlay();
            });

            document.getElementById('vineyard-link').addEventListener('click', function() {
                closeAllOverlays();
                showVineyardOverlay();
            });

            document.getElementById('buildings-link').addEventListener('click', function() {
                closeAllOverlays();
                showBuildingsOverlay();
            });

            document.getElementById('staff-link').addEventListener('click', function() {
                closeAllOverlays();
                showStaffOverlay();
            });

            document.getElementById('winekipedia-link').addEventListener('click', function() {
                closeAllOverlays();
                showWineKipediaOverlay();
            });

            document.getElementById('settings-link').addEventListener('click', function() {
                closeAllOverlays();
                showSettingsOverlay();
            });
        });
}

export { initializePanel };