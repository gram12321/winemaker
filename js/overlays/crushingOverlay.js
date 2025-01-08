
import { formatNumber, getWineQualityCategory, getColorClass } from '../utils.js';
//import { populateStorageTable } from '../resource.js';
import { addConsoleMessage } from '../console.js';
import { showWineryOverlay } from './mainpages/wineryoverlay.js';

export function showCrushingOverlay() {
  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'overlay';

  overlayContainer.innerHTML = `
    <div class="overlay-content">
      <h2>Grape Crushing</h2>
      <div class="crushing-section">
        <h4>Select Grapes to Crush</h4>
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
      </div>
      
      <div class="must-storage-section">
        <h4>Select Must Storage Container</h4>
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Select</th>
              <th>Container</th>
              <th>Capacity</th>
              <th>Available Space</th>
            </tr>
          </thead>
          <tbody id="crushing-must-storage-table">
          </tbody>
        </table>
      </div>
      
      <button class="btn btn-success crush-btn">Crush Selected Grapes</button>
      <button class="btn btn-secondary close-btn">Close</button>
    </div>
  `;

  document.body.appendChild(overlayContainer);

  // Populate grape storage table
  const storageTableBody = document.getElementById('crushing-storage-table');
  const buildings = JSON.parse(localStorage.getItem('buildings')) || [];
  const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];

  // Populate must storage options
  const mustStorageBody = document.getElementById('crushing-must-storage-table');
  mustStorageBody.innerHTML = ''; // Clear existing content
  
  buildings.forEach(building => {
    if (!building.tools) return;
    
    building.tools.forEach(tool => {
      if (tool.supportedResources?.includes('Must')) {
        const toolId = `${tool.name} #${tool.instanceNumber}`;
        const matchingInventoryItems = playerInventory.filter(item => 
          item.storage === toolId
        );
        const currentAmount = matchingInventoryItems.reduce((sum, item) => sum + item.amount, 0);
        const availableSpace = tool.capacity - currentAmount;

        if (availableSpace > 0) {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td><input type="radio" name="must-storage" value="${toolId}" 
                data-capacity="${tool.capacity}" data-available="${availableSpace}"></td>
            <td>${toolId}</td>
            <td>${formatNumber(tool.capacity)} l</td>
            <td>${formatNumber(availableSpace)} l</td>
          `;
          mustStorageBody.appendChild(row);
        }
      }
    });
  });

  // Populate grapes table
  buildings.forEach(building => {
    if (!building.tools) return;
    
    building.tools.forEach(tool => {
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
                data-amount="${item.amount}"
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
    const selectedGrapes = overlayContainer.querySelectorAll('.grape-select:checked');
    const selectedMustStorage = overlayContainer.querySelector('input[name="must-storage"]:checked');

    if (!selectedMustStorage) {
      addConsoleMessage("Please select a storage container for the must");
      return;
    }

    const mustStorage = selectedMustStorage.value;
    const availableSpace = parseFloat(selectedMustStorage.dataset.available);
    const totalGrapes = Array.from(selectedGrapes)
      .reduce((sum, checkbox) => sum + parseFloat(checkbox.dataset.amount), 0);

    if (totalGrapes > availableSpace) {
      addConsoleMessage("Not enough space in selected container for all the must");
      return;
    }

    let playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
    
    selectedGrapes.forEach(checkbox => {
      const storage = checkbox.dataset.storage;
      const resourceName = checkbox.dataset.resource;
      const vintage = checkbox.dataset.vintage;
      const quality = parseFloat(checkbox.dataset.quality);
      const fieldName = checkbox.dataset.field;

      const filteredItems = [];
      const mustItems = [];

      playerInventory.forEach(item => {
        if (item.storage === storage && 
            item.resource.name === resourceName && 
            item.state === 'Grapes') {
          const mustItem = {...item};
          mustItem.state = 'Must';
          mustItem.storage = mustStorage;
          addConsoleMessage(`Crushed ${formatNumber(item.amount)} t of ${resourceName} grapes from ${fieldName}`);
          mustItems.push(mustItem);
          // Don't add the original item to filteredItems
        } else if (item.storage !== storage) {
          // Only keep items from other storage containers
          filteredItems.push(item);
        }
      });

      playerInventory = [...filteredItems, ...mustItems];
      localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
    });
    
    // Refresh the winery overlay tables
    showWineryOverlay();
    removeOverlay();
  });

  // Close button functionality
  const closeBtn = overlayContainer.querySelector('.close-btn');
  closeBtn.addEventListener('click', removeOverlay);

  function removeOverlay() {
    document.body.removeChild(overlayContainer);
  }
}
