export function showInventoryOverlay() {
    // Remove any existing instances of the overlay
    const existingOverlay = document.querySelector('.mainview-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create overlay element
    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');

    // Create placeholder content
    overlay.innerHTML = `
        <div class="mainview-overlay-content">
            <h3>Inventory</h3>
            <p>Inventory system is being rebuilt...</p>
        </div>
    `;

    // Append overlay to document body
    document.body.appendChild(overlay);
    overlay.style.display = 'block';
}