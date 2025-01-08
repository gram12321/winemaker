
import { fermentMust } from '../wineprocessing.js';
import { populateStorageTable } from '../resource.js';
import { addConsoleMessage } from '../console.js';

export function showFermentationOverlay() {
    const overlayContainer = document.createElement('div');
    overlayContainer.className = 'overlay';

    overlayContainer.innerHTML = `
        <div class="overlay-content">
            <h2>Ferment Must</h2>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Select</th>
                        <th>Container</th>
                        <th>Capacity</th>
                        <th>Resource</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody id="fermentation-storage-body">
                </tbody>
            </table>
            <button class="btn btn-success ferment-btn">Ferment</button>
            <button class="btn btn-secondary close-btn">Close</button>
        </div>
    `;

    document.body.appendChild(overlayContainer);

    // Populate table with only fermentation tanks containing must
    populateStorageTable('fermentation-storage-body', true);

    // Add event listeners
    const fermentButton = overlayContainer.querySelector('.ferment-btn');
    fermentButton.addEventListener('click', () => {
        const selectedRadio = overlayContainer.querySelector('input[name="tool-select"]:checked');
        if (selectedRadio) {
            const storage = selectedRadio.value;
            const resourceCell = selectedRadio.closest('tr').querySelector('td:nth-child(4)');
            const resourceName = resourceCell.textContent.split(',')[1].trim();
            fermentMust(resourceName, storage);
            removeOverlay();
        } else {
            addConsoleMessage('Please select a fermentation tank.');
        }
    });

    const closeButton = overlayContainer.querySelector('.close-btn');
    closeButton.addEventListener('click', removeOverlay);

    function removeOverlay() {
        document.body.removeChild(overlayContainer);
    }
}
