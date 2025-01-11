import { showBuyLandOverlay } from '/js/overlays/buyLandOverlay.js';
import { displayFarmland } from '/js/farmland.js';

export function showLandOverlay() {
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    overlay.innerHTML = `
        <div class="mainview-overlay-content overlay-container">
            <h2 class="mb-4">Farmland Management</h2>
            <section id="vineyard-section" class="overlay-section card mb-4">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Owned Farmland</h3>
                    <button id="buy-land-btn" class="btn btn-light btn-sm">Buy Land</button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover overlay-table">
                            <thead>
                                <tr>
                                    <th>Farmland</th>
                                    <th>Field Name</th>
                                    <th>Country/Region</th>
                                    <th>Size</th>
                                    <th>Crop</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="farmland-entries">
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
            <div id="buyLandOverlay" class="overlay" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5);">
                <div id="farmland-table-container" style="position: relative; top: 50%; transform: translateY(-50%);"></div>
            </div>
            <div id="farmlandOverlay" class="overlay" style="display: none;">
                <div class="overlay-content text-center">
                    <div id="farmland-details"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const buyLandBtn = overlay.querySelector('#buy-land-btn');
    if (buyLandBtn) {
        buyLandBtn.addEventListener('click', showBuyLandOverlay);
    }

    displayFarmland();
    overlay.style.display = 'block';
}