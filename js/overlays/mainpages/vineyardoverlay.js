import { farmlandYield } from '../../farmland.js';
import { showFarmlandOverlay } from '../farmlandOverlay.js';
import { showHarvestOverlay } from '../harvestOverlay.js';

export function showVineyardOverlay() {
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    overlay.innerHTML = `
        <div class="mainview-overlay-content">
            <h1>Vineyard</h1>
            <p>Here you can manage your vineyards, check grape quality and more.</p>
            <div id="vineyard-table-container"></div>
        </div>
    `;

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
            ${farmlands.map(farmland => {
                const canHarvest = farmland.plantedResourceName && farmland.ripeness >= 0.10;
                return `
                    <tr data-farmland-id="${farmland.id}">
                        <td>${farmland.name}</td>
                        <td>${farmland.acres} acres</td>
                        <td>${farmland.plantedResourceName ? farmland.vineAge : 'Not Planted'}</td>
                        <td>${farmland.plantedResourceName || 'None'}</td>
                        <td>${farmland.status}</td>
                        <td>${farmland.plantedResourceName ? (farmland.ripeness * 100).toFixed(1) + '%' : 'Not Planted'}</td>
                        <td>${farmlandYield(farmland).toFixed(2)} kg</td>
                        <td>
                            <button class="btn btn-success harvest-btn" 
                                    data-farmland-id="${farmland.id}"
                                    ${!canHarvest ? 'disabled' : ''}>
                                Harvest
                            </button>
                        </td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;

    document.body.appendChild(overlay);

    const container = document.getElementById('vineyard-table-container');
    container.appendChild(table);

    const rows = table.querySelectorAll('tr[data-farmland-id]');
    rows.forEach(row => {
        row.addEventListener('click', (e) => {
            if (!e.target.classList.contains('harvest-btn')) {
                const farmlandId = row.dataset.farmlandId;
                const farmland = farmlands.find(f => f.id === parseInt(farmlandId));
                if (farmland) {
                    showFarmlandOverlay(farmland);
                }
            }
        });

        const harvestBtn = row.querySelector('.harvest-btn');
        if (harvestBtn) {
            harvestBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const farmlandId = harvestBtn.dataset.farmlandId;
                const farmland = farmlands.find(f => f.id === parseInt(farmlandId));
                if (farmland) {
                    showHarvestOverlay(farmland, farmlandId);
                }
            });
        }
    });

    overlay.style.display = 'block';
}