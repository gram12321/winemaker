
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
        <div class="mainview-overlay-content overlay-container">
            <h2 class="mb-4">Vineyard Management</h2>
            
            <div class="overlay-sections">
                <section class="overlay-section card mb-4">
                    <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                        <h3 class="h5 mb-0">Vineyard Fields</h3>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
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
                                <tbody id="vineyard-table">
                                    ${(JSON.parse(localStorage.getItem('ownedFarmlands')) || []).map(farmland => {
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
                                                    <button class="btn btn-success btn-sm harvest-btn" 
                                                            data-farmland-id="${farmland.id}"
                                                            ${!canHarvest ? 'disabled' : ''}>
                                                        Harvest
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const rows = overlay.querySelectorAll('tr[data-farmland-id]');
    rows.forEach(row => {
        row.addEventListener('click', (e) => {
            if (!e.target.classList.contains('harvest-btn')) {
                const farmlandId = row.dataset.farmlandId;
                const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
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
                const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
                const farmland = farmlands.find(f => f.id === parseInt(farmlandId));
                if (farmland) {
                    showHarvestOverlay(farmland, farmlandId);
                }
            });
        }
    });

    overlay.style.display = 'block';
}
