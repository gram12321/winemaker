
import { formatNumber, getWineQualityCategory, getColorClass } from '/js/utils.js';

export function showWineryOverlay() {
    // Remove any existing instances of the overlay
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create overlay element
    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    // Create content for the overlay
    overlay.innerHTML = `
        <div class="mainview-overlay-content">
            <h3>Winery</h3>
            <div class="winery-container">
                <!-- Winery content will go here -->
                <p>Manage your wine production here.</p>
            </div>
        </div>
    `;

    // Append overlay to document body
    document.body.appendChild(overlay);
    overlay.style.display = 'block';
}
