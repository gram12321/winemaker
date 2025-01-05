
import { displayInventory, populateStorageTable } from '/js/resource.js';

export function showInventoryOverlay() {
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
            <h3>Inventory</h3>
            
            <section class="my-4">
                <h4>Storage</h4>
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Container</th>
                            <th>Capacity</th>
                            <th>Resource</th>
                            <th>Amount</th>
                            <th>Quality</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="storage-table-body">
                    </tbody>
                </table>
            </section>

            <section class="my-4">
                <h4>Fermentation Tanks</h4>
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Resource</th>
                            <th>Amount</th>
                            <th>Quality</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="fermentation-table-body">
                    </tbody>
                </table>
            </section>

            <section class="my-4">
                <h4>Wine Cellar</h4>
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Resource</th>
                            <th>Amount</th>
                            <th>Quality</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="winecellar-table-body">
                    </tbody>
                </table>
            </section>
        </div>
    `;

    // Append overlay to document body
    document.body.appendChild(overlay);
    overlay.style.display = 'block';

    // Populate tables
    populateStorageTable('storage-table-body');
    displayInventory(inventoryInstance);
}
