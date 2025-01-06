import { displayVineyard } from '../../vineyard.js';

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

    // Display vineyard table
    const vineyardTable = displayVineyard();
    document.getElementById('vineyard-table-container').appendChild(vineyardTable);

    // Show the overlay
    overlay.style.display = 'block';

    // Add event listener for farmland row clicks (placeholder)
    overlay.addEventListener('click', (event) => {
        if (event.target.classList.contains('farmland-row')) {
            const farmlandId = event.target.dataset.farmlandId;
            // Implement logic to show farmland overlay here using farmlandId
            console.log("Farmland row clicked:", farmlandId); // Placeholder - Replace with farmland overlay display logic
        }
    });
}