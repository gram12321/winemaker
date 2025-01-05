
// Import required functions
//import { showBuyLandOverlay } from '/js/overlays/buyLandOverlay.js';

export function showLandOverlay() {
    // Remove any existing instances of the overlay
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create the overlay element
    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    // Create content for the overlay
    overlay.innerHTML = `
        <div class="mainview-overlay-content">
            <h1>Farmland</h1>
            <button id="buy-land-btn" class="btn btn-success mt-3">Buy Land</button>

            <!-- Buy Land Overlay -->
            <div id="buyLandOverlay" class="overlay" style="display: none;">
                <div class="overlay-content">
                    <span id="closeBuyLandOverlay" class="close-btn">&times;</span>
                    <h2>Available Farmlands</h2>
                    <div id="farmland-table-container"></div>
                </div>
            </div>

            <!-- Farmland Overlay -->
            <div id="farmlandOverlay" class="overlay" style="display: none;">
                <div class="overlay-content text-center">
                    <span id="closeFarmlandOverlay" class="close-btn">&times;</span>
                    <div id="farmland-details"></div>
                </div>
            </div>
        </div>
    `;

    // Append overlay to the document body
    document.body.appendChild(overlay);

    // Display the overlay
    overlay.style.display = 'block';

    // Add event listener for buy land button
    const buyLandBtn = overlay.querySelector('#buy-land-btn');
    if (buyLandBtn) {
        buyLandBtn.addEventListener('click', showBuyLandOverlay);
    }
}
