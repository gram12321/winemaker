// loadPanel.js
import { loadStaff} from './database/adminFunctions.js';
import { saveStaff, loadBuildings, storeBuildings   } from './database/adminFunctions.js';
import { addConsoleMessage } from './console.js';
import { formatNumber } from './utils.js';
import { Building } from './buildings.js';
import { selectContainerOverlay } from './overlays/selectContainerOverlay.js';

// Initialize Task Panel
function initializePanel() {
    return fetch('/html/panel.html')
        .then(response => response.text())
        .then(data => {
            const panelContainer = document.createElement('div');
            panelContainer.innerHTML = data;
            document.body.appendChild(panelContainer);
        });
}

export { initializePanel };