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
        </div>
    `;

    // Append overlay to the document body
    document.body.appendChild(overlay);

    // Show the overlay
    overlay.style.display = 'block';
}



