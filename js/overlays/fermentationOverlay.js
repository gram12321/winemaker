
import { fermentMust } from '../wineprocessing.js';
import { addConsoleMessage } from '../console.js';
import { formatNumber, getColorClass } from '../utils.js';
import { showWineryOverlay } from './mainpages/wineryoverlay.js';

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
                        <th>Quality</th>
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

    const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
    const buildings = JSON.parse(localStorage.getItem('buildings')) || [];
    const storageBody = document.getElementById('fermentation-storage-body');
    
    buildings.forEach(building => {
        if (!building.tools) return;
        
        building.tools.forEach(tool => {
            if (tool.supportedResources?.includes('Must')) {
                const toolId = `${tool.name} #${tool.instanceNumber}`;
                const matchingInventoryItems = playerInventory.filter(item => 
                    item.storage === toolId && 
                    item.state === 'Must'
                );
                
                matchingInventoryItems.forEach(item => {
                    const row = document.createElement('tr');
                    const qualityDisplay = `<span class="${getColorClass(item.quality)}">(${(item.quality * 100).toFixed(0)}%)</span>`;
                    
                    row.innerHTML = `
                        <td><input type="radio" name="must-select" data-resource="${item.resource.name}" 
                            data-storage="${toolId}" data-vintage="${item.vintage}"
                            data-quality="${item.quality}" data-field="${item.fieldName}"
                            data-prestige="${item.fieldPrestige}"
                            data-amount="${item.amount}"></td>
                        <td>${toolId}</td>
                        <td>${tool.capacity}</td>
                        <td><strong>${item.fieldName}</strong>, ${item.resource.name}, ${item.vintage}</td>
                        <td>${formatNumber(item.amount)} l</td>
                        <td>${qualityDisplay}</td>
                    `;
                    storageBody.appendChild(row);
                });
            }
        });
    });

    const fermentButton = overlayContainer.querySelector('.ferment-btn');
    fermentButton.addEventListener('click', () => {
        const selectedMust = overlayContainer.querySelector('input[name="must-select"]:checked');
        if (selectedMust) {
            const storage = selectedMust.dataset.storage;
            const resourceName = selectedMust.dataset.resource;
            fermentMust(resourceName, storage);
            showWineryOverlay();
            removeOverlay();
        } else {
            addConsoleMessage('Please select must to ferment.');
        }
    });

    const closeButton = overlayContainer.querySelector('.close-btn');
    closeButton.addEventListener('click', removeOverlay);

    function removeOverlay() {
        document.body.removeChild(overlayContainer);
    }
}
