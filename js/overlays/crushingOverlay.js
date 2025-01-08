
import { formatNumber, getWineQualityCategory, getColorClass } from '../utils.js';
import { addConsoleMessage } from '../console.js';
import { showWineryOverlay } from './mainpages/wineryoverlay.js';

function createOverlayStructure() {
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
  return overlayContainer;
}

function populateTables(overlayContainer) {
  const buildings = JSON.parse(localStorage.getItem('buildings')) || [];
  const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
  
  populateMustStorageTable(overlayContainer, buildings, playerInventory);
  populateGrapesTable(overlayContainer, buildings, playerInventory);
}

function populateMustStorageTable(overlayContainer, buildings, playerInventory) {
  const mustStorageBody = overlayContainer.querySelector('#crushing-must-storage-table');
  mustStorageBody.innerHTML = '';
  
  buildings.forEach(building => {
    if (!building.tools) return;
    
    building.tools.forEach(tool => {
      if (tool.supportedResources?.includes('Must')) {
        const toolId = `${tool.name} #${tool.instanceNumber}`;
        const matchingInventoryItems = playerInventory.filter(item => item.storage === toolId);
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
}

function populateGrapesTable(overlayContainer, buildings, playerInventory) {
  const storageTableBody = overlayContainer.querySelector('#crushing-storage-table');
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
}

function handleCrushing(overlayContainer) {
  const selectedGrapes = overlayContainer.querySelectorAll('.grape-select:checked');
  const selectedMustStorage = overlayContainer.querySelector('input[name="must-storage"]:checked');

  if (!selectedMustStorage) {
    addConsoleMessage("Please select a storage container for the must");
    return false;
  }

  const mustStorage = selectedMustStorage.value;
  const availableSpace = parseFloat(selectedMustStorage.dataset.available);
  const totalGrapes = Array.from(selectedGrapes)
    .reduce((sum, checkbox) => sum + parseFloat(checkbox.dataset.amount), 0);

  if (totalGrapes > availableSpace) {
    addConsoleMessage("Not enough space in selected container for all the must");
    return false;
  }

  let playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
  const filteredItems = [];
  const mustItems = [];

  selectedGrapes.forEach(checkbox => {
    const resourceName = checkbox.dataset.resource;
    const vintage = checkbox.dataset.vintage;
    const quality = checkbox.dataset.quality;
    const fieldName = checkbox.dataset.field;
    const fieldPrestige = checkbox.dataset.prestige;
    const amount = parseFloat(checkbox.dataset.amount);

    const mustItem = {
      resource: { name: resourceName, naturalYield: 1 },
      amount: amount,
      state: 'Must',
      vintage: vintage,
      quality: quality,
      fieldName: fieldName,
      fieldPrestige: fieldPrestige,
      storage: mustStorage
    };

    addConsoleMessage(`Crushed ${formatNumber(amount)} t of ${resourceName} grapes from ${fieldName}`);
    mustItems.push(mustItem);
  });

  playerInventory.forEach(item => {
    const isBeingCrushed = selectedGrapes.some(grape => 
      grape.dataset.storage === item.storage && 
      grape.dataset.resource === item.resource.name &&
      grape.dataset.vintage === item.vintage.toString()
    );
    if (!isBeingCrushed) {
      filteredItems.push(item);
    }
  });

  playerInventory = [...filteredItems, ...mustItems];
  localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
  return true;
}

export function showCrushingOverlay() {
  const overlayContainer = createOverlayStructure();
  document.body.appendChild(overlayContainer);

  populateTables(overlayContainer);

  const crushBtn = overlayContainer.querySelector('.crush-btn');
  crushBtn.addEventListener('click', () => {
    if (handleCrushing(overlayContainer)) {
      showWineryOverlay();
      removeOverlay();
    }
  });

  const closeBtn = overlayContainer.querySelector('.close-btn');
  closeBtn.addEventListener('click', removeOverlay);

  function removeOverlay() {
    document.body.removeChild(overlayContainer);
  }
}
