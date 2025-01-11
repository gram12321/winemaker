
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
                    <h3 class="h5 mb-0">Available Land</h3>
                    <button id="buy-land-btn" class="btn btn-light btn-sm">Buy Land</button>
                </div>
            </section>

            <section id="farmland-section" class="overlay-section card mb-4">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Owned Farmland</h3>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table overlay-table">
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

            <div id="buyLandOverlay" class="overlay" style="display: none;">
                <div class="overlay-content">
                    <div id="farmland-table-container"></div>
                </div>
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
