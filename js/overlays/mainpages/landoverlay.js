
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
            <button id="buy-land-btn" class="btn btn-light mb-4">Buy Land</button>

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

            <div id="buyLandOverlay" class="overlay">
                <div class="overlay-content">
                    <span id="closeBuyLandOverlay" class="close-btn">&times;</span>
                    <h2>Available Farmlands</h2>
                    <div id="farmland-table-container"></div>
                </div>
            </div>

            <div id="farmlandOverlay" class="overlay">
                <div class="overlay-content text-center">
                    <span id="closeFarmlandOverlay" class="close-btn">&times;</span>
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
