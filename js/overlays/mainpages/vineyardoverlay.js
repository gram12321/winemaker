
import { displayVineyard } from '../../vineyard.js';
import { showFarmlandOverlay } from '../farmlandOverlay.js';

// Function to create and display the vineyard overlay
export function showVineyardOverlay() {
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    // Create content element within overlay
    overlay.innerHTML = `
        <div class="mainview-overlay-content">
            <h1>Vineyard</h1>
            <p>Here you can manage your vineyards, check grape quality and more.</p>
            <div id="vineyard-table-container"></div>
        </div>
    `;

    // Append overlay to the document body
    document.body.appendChild(overlay);

    // Display vineyard table
    const vineyardTable = displayVineyard();
    document.getElementById('vineyard-table-container').appendChild(vineyardTable);

    // Add click handlers to vineyard rows
    const rows = vineyardTable.querySelectorAll('tr[data-farmland-id]');
    rows.forEach(row => {
        row.addEventListener('click', () => {
            const farmlandId = row.dataset.farmlandId;
            const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
            const farmland = farmlands.find(f => f.id === parseInt(farmlandId));
            if (farmland) {
                showFarmlandOverlay(farmland);
            }
        });
    });

    // Show the overlay
    overlay.style.display = 'block';
}
