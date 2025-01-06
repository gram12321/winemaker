
import { formatNumber, getWineQualityCategory, getColorClass } from '/js/utils.js';
import { populateStorageTable } from '/js/resource.js';

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
                <section class="my-4">
                    <h4>Grapes in Inventory</h4>
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Container</th>
                                <th>Capacity</th>
                                <th>Resource</th>
                                <th>Amount</th>
                                <th>Quality</th>
                            </tr>
                        </thead>
                        <tbody id="grape-storage-table">
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    `;

    // Append overlay to document body
    document.body.appendChild(overlay);

    // Populate storage table
    const buildings = JSON.parse(localStorage.getItem('buildings')) || [];
    const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
    const storageTableBody = document.getElementById('grape-storage-table');

    buildings.forEach(building => {
        building.contents.forEach(tool => {
            if (tool.supportedResources?.includes('Grapes')) {
                const row = document.createElement('tr');
                const matchingInventoryItems = playerInventory.filter(item => 
                    item.storage === `${tool.name} #${tool.instanceNumber}` && 
                    item.state === 'Grapes'
                );
                const firstItem = matchingInventoryItems[0];

                const totalAmount = matchingInventoryItems.reduce((sum, item) => sum + item.amount, 0);
                
                let qualityDisplay = 'N/A';
                if (firstItem?.quality) {
                    const colorClass = getColorClass(firstItem.quality);
                    qualityDisplay = `<span class="${colorClass}">(${(firstItem.quality * 100).toFixed(0)}%)</span>`;
                }

                row.innerHTML = `
                    <td>${tool.name} #${tool.instanceNumber}</td>
                    <td>${tool.capacity}</td>
                    <td>${firstItem ? `<strong>${firstItem.fieldName}</strong>, ${firstItem.resource.name}, ${firstItem.vintage || 'Unknown'}` : 'N/A'}</td>
                    <td>${formatNumber(totalAmount)} t</td>
                    <td>${qualityDisplay}</td>
                `;

                storageTableBody.appendChild(row);
            }
        });
    });

    overlay.style.display = 'block';
}
