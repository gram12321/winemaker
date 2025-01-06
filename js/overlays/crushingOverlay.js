
import { formatNumber, getWineQualityCategory, getColorClass } from '../utils.js';
import { populateStorageTable } from '../resource.js';
import { addConsoleMessage } from '../console.js';

export function showCrushingOverlay() {
  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'overlay';

  overlayContainer.innerHTML = `
    <div class="overlay-content">
      <h2>Grape Crushing</h2>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Select</th>
            <th>Container</th>
            <th>Resource</th>
            <th>Amount</th>
            <th>Quality</th>
          </tr>
        </thead>
        <tbody id="crushing-storage-table">
        </tbody>
      </table>
      <button class="btn btn-success crush-btn">Crush Selected Grapes</button>
      <button class="btn btn-secondary close-btn">Close</button>
    </div>
  `;

  document.body.appendChild(overlayContainer);

  // Populate table with grape storage
  const storageTableBody = document.getElementById('crushing-storage-table');
  const buildings = JSON.parse(localStorage.getItem('buildings')) || [];
  const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];

  buildings.forEach(building => {
    building.contents.forEach(tool => {
      if (tool.supportedResources?.includes('Grapes')) {
        const matchingInventoryItems = playerInventory.filter(item => 
          item.storage === `${tool.name} #${tool.instanceNumber}` &&
          item.state === 'Grapes'
        );

        matchingInventoryItems.forEach(item => {
          const row = document.createElement('tr');
          const qualityDisplay = `<span class="${getColorClass(item.quality)}">(${(item.quality * 100).toFixed(0)}%)</span>`;

          row.innerHTML = `
            <td><input type="checkbox" class="grape-select" data-storage="${item.storage}" 
                data-resource="${item.resource.name}" data-vintage="${item.vintage}" 
                data-quality="${item.quality}" data-field="${item.fieldName}"
                data-prestige="${item.fieldPrestige}"></td>
            <td>${item.storage}</td>
            <td><strong>${item.fieldName}</strong>, ${item.resource.name}, ${item.vintage}</td>
            <td>${formatNumber(item.amount)} t</td>
            <td>${qualityDisplay}</td>
          `;

          storageTableBody.appendChild(row);
        });
      }
    });
  });

  // Handle crushing
  const crushBtn = overlayContainer.querySelector('.crush-btn');
  crushBtn.addEventListener('click', () => {
    console.log('Crush button clicked');
    const selectedGrapes = overlayContainer.querySelectorAll('.grape-select:checked');
    console.log('Selected grapes:', selectedGrapes.length);
    
    selectedGrapes.forEach(checkbox => {
      const storage = checkbox.dataset.storage;
      const resourceName = checkbox.dataset.resource;
      const vintage = checkbox.dataset.vintage;
      const quality = parseFloat(checkbox.dataset.quality);
      const fieldName = checkbox.dataset.field;
      const fieldPrestige = parseFloat(checkbox.dataset.prestige);

      const matchingItem = playerInventory.find(item =>
        item.storage === storage &&
        item.resource.name === resourceName &&
        item.vintage === vintage &&
        item.quality === quality &&
        item.fieldName === fieldName
      );

      if (matchingItem) {
        console.log('Found matching item:', matchingItem);
        try {
          // Get fresh inventory data
          const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
          console.log('Current inventory length:', playerInventory.length);
          
          // Find the grape item
          const itemIndex = playerInventory.findIndex(item => 
            item.storage === storage &&
            item.resource.name === resourceName &&
            item.vintage === vintage &&
            item.quality === quality &&
            item.fieldName === fieldName &&
            item.state === 'Grapes'
          );
          
          if (itemIndex !== -1) {
            // Create the must item
            const mustItem = {
              ...playerInventory[itemIndex],
              state: 'Must'
            };
            
            // Remove grape item and add must item
            playerInventory.splice(itemIndex, 1);
            playerInventory.push(mustItem);
            
            // Save updated inventory
            localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
            
            addConsoleMessage(`Crushed ${formatNumber(matchingItem.amount)} t of ${resourceName} grapes from ${fieldName}`);
          }
        } catch (error) {
          console.error('Error during grape crushing:', error);
          addConsoleMessage('Error occurred while crushing grapes');
        }
      }
    });
    removeOverlay();
  });

  // Close button functionality
  const closeBtn = overlayContainer.querySelector('.close-btn');
  closeBtn.addEventListener('click', removeOverlay);

  function removeOverlay() {
    document.body.removeChild(overlayContainer);
  }
}
