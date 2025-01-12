
import { formatNumber, getWineQualityCategory, getColorClass } from '../utils.js';
import { addConsoleMessage } from '../console.js';
import { showWineryOverlay } from './mainpages/wineryoverlay.js';
import { inventoryInstance } from '../resource.js';

function createOverlayStructure() {
  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'overlay';
  overlayContainer.innerHTML = `
    <div class="overlay-content overlay-container">
      <section id="vineyard-section" class="overlay-section card mb-4">
        <div class="card-header text-white d-flex justify-content-between align-items-center">
          <h3 class="h5 mb-0">Grape Crushing</h3>
          <button class="btn btn-light btn-sm close-btn">Close</button>
        </div>
        <div class="card-header text-white d-flex justify-content-between align-items-center">
          <h3 class="h5 mb-0">Select Grapes to Crush</h3>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover overlay-table">
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
        </div>
      </section>
      
      <section id="must-section" class="overlay-section card mb-4">
        <div class="card-header text-white d-flex justify-content-between align-items-center">
          <h3 class="h5 mb-0">Select Must Storage Container</h3>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover overlay-table">
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
      <div class="d-flex justify-content-end mt-3">
        <button class="btn btn-light btn-sm crush-btn">Crush Selected Grapes</button>
      </div>
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
            <td><input type="radio" name="grape-select" class="grape-select" data-storage="${item.storage}" 
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
  const selectedGrape = overlayContainer.querySelector('.grape-select:checked');
  const selectedMustStorage = overlayContainer.querySelector('input[name="must-storage"]:checked');

  if (!selectedMustStorage) {
    addConsoleMessage("Please select a storage container for the must");
    return false;
  }

  const mustStorage = selectedMustStorage.value;
  const availableSpace = parseFloat(selectedMustStorage.dataset.available);
  const totalGrapes = parseFloat(selectedGrape.dataset.amount);

  if (totalGrapes > availableSpace) {
    addConsoleMessage("Not enough space in selected container for all the must");
    return false;
  }

  // Check if container has existing content
  const existingMust = inventoryInstance.items.filter(item => 
    item.storage === mustStorage && 
    item.state === 'Must'
  );

  if (existingMust.length > 0) {
    const firstGrape = selectedGrapes[0];
    const firstMust = existingMust[0];
    
    if (firstMust.resource.name !== firstGrape.dataset.resource ||
        firstMust.vintage !== parseInt(firstGrape.dataset.vintage) ||
        firstMust.fieldName !== firstGrape.dataset.field) {
      addConsoleMessage("Container already contains different content. Cannot mix different must types.");
      return false;
    }
  }

  const resourceName = selectedGrape.dataset.resource;
  const storage = selectedGrape.dataset.storage;
  const vintage = parseInt(selectedGrape.dataset.vintage);
  const quality = selectedGrape.dataset.quality;
  const fieldName = selectedGrape.dataset.field;
  const fieldPrestige = parseFloat(selectedGrape.dataset.prestige);
  const amount = parseFloat(selectedGrape.dataset.amount);

    // Remove grapes from original storage
    const removed = inventoryInstance.removeResource(
      { name: resourceName },
      amount,
      'Grapes',
      vintage,
      storage
    );

    if (removed) {
      // Add must to new storage
      inventoryInstance.addResource(
        { name: resourceName, naturalYield: 1 },
        amount,
        'Must',
        vintage,
        quality,
        fieldName,
        fieldPrestige,
        mustStorage
      );
      addConsoleMessage(`Crushed ${formatNumber(amount)} t of ${resourceName} grapes from ${fieldName}`);
    }
  });

  inventoryInstance.save();
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
