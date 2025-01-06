
import { farmlandYield } from '../../farmland.js';
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

    // Create and display vineyard table
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const table = document.createElement('table');
    table.className = 'table table-bordered';
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>Field Name</th>
                <th>Size</th>
                <th>Vine Age</th>
                <th>Crop</th>
                <th>Status</th>
                <th>Ripeness</th>
                <th>Expected Yield</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${farmlands.map(farmland => `
                <tr data-farmland-id="${farmland.id}">
                    <td>${farmland.name}</td>
                    <td>${farmland.acres} acres</td>
                    <td>${farmland.vineAge || '-'}</td>
                    <td>${farmland.plantedResourceName || 'None'}</td>
                    <td>${farmland.status}</td>
                    <td>${(farmland.ripeness * 100).toFixed(1)}%</td>
                    <td>${farmlandYield(farmland).toFixed(2)} kg</td>
                    <td></td>
                </tr>
            `).join('')}
        </tbody>
    `;

    document.getElementById('vineyard-table-container').appendChild(table);

    // Add click handlers to vineyard rows
    const rows = table.querySelectorAll('tr[data-farmland-id]');
    rows.forEach(row => {
        row.addEventListener('click', () => {
            const farmlandId = row.dataset.farmlandId;
            const farmland = farmlands.find(f => f.id === parseInt(farmlandId));
            if (farmland) {
                showFarmlandOverlay(farmland);
            }
        });
    });

    // Show the overlay
    overlay.style.display = 'block';
}
