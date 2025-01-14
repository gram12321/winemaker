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
        <div class="card-body"></div>
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
          <h3 class="h5 mb-0">Select Must Storage Containers</h3>
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
        </div>
      </section>
      
      <div class="button-container d-flex flex-column align-items-center mt-3 mb-3 px-3">
        <div class="mb-2">
          <span>Selected Grapes: </span>
          <span id="selected-grapes">0 t</span>
        </div>
        <div class="w-100">
          <span>Selected Storage: </span>
          <span id="selected-storage">0 l</span>
          <div class="progress" style="height: 20px; background-color: var(--color-background); border: 1px solid var(--color-accent); border-radius: var(--radius-md);">
            <div id="selected-storage-progress" class="progress-bar" role="progressbar" style="width: 0%; background-color: var(--color-primary);" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        </div>
        <button class="btn btn-light btn-sm crush-btn mt-3" style="background-color: var(--color-primary); color: var(--panel-text); border: 1px solid var(--color-accent); border-radius: var(--radius-md);">Crush Selected Grapes</button>
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
            <td><input type="checkbox" name="must-storage" value="${toolId}" 
                data-capacity="${tool.capacity}" data-available="${availableSpace}"></td>
            <td>${toolId}</td>
            <td>${formatNumber(tool.capacity)} l</td>
            <td>${formatNumber(availableSpace)} l</td>
          `;
          mustStorageBody.appendChild(row);

          // Add event listener to update selected storage
          row.querySelector('input[name="must-storage"]').addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('input[name="must-storage"]:checked');
            let totalStorage = 0;
            checkboxes.forEach(checkbox => {
              totalStorage += parseFloat(checkbox.dataset.available);
            });
            const storageDisplay = document.getElementById('selected-storage');
            storageDisplay.textContent = totalStorage >= 1000 ? 
              formatNumber(totalStorage / 1000, 2) + ' t' : 
              formatNumber(totalStorage) + ' l';

            const selectedGrapes = parseFloat(document.querySelector('.grape-select:checked')?.dataset.amount || 0);
            const storageProgress = document.getElementById('selected-storage-progress');
            const progressPercentage = Math.min((totalStorage / selectedGrapes) * 100, 100);
            storageProgress.style.width = `${progressPercentage}%`;
            storageProgress.setAttribute('aria-valuenow', progressPercentage);
          });
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

          // Add event listener to update selected grapes
          row.querySelector('.grape-select').addEventListener('change', function() {
            const selectedGrapes = parseFloat(this.dataset.amount);
            const grapesDisplay = document.getElementById('selected-grapes');
            grapesDisplay.textContent = selectedGrapes >= 1000 ? 
              formatNumber(selectedGrapes / 1000, 2) + ' t' : 
              formatNumber(selectedGrapes) + ' t';

            const checkboxes = document.querySelectorAll('input[name="must-storage"]:checked');
            let totalStorage = 0;
            checkboxes.forEach(checkbox => {
              totalStorage += parseFloat(checkbox.dataset.available);
            });
            const storageProgress = document.getElementById('selected-storage-progress');
            const progressPercentage = Math.min((totalStorage / selectedGrapes) * 100, 100);
            storageProgress.style.width = `${progressPercentage}%`;
            storageProgress.setAttribute('aria-valuenow', progressPercentage);
          });
        });
      }
    });
  });
}

function handleCrushing(overlayContainer, totalGrapes, totalAvailableSpace, selectedGrape, selectedMustStorages) {
  let remainingGrapes = totalGrapes;
  let success = true;

  // Distribute must among containers
  for (const storage of selectedMustStorages) {
    const mustStorage = storage.value;
    const availableSpace = parseFloat(storage.dataset.available);
    const amountToStore = Math.min(remainingGrapes, availableSpace);

    if (amountToStore > 0) {
      inventoryInstance.addResource(
        { name: selectedGrape.dataset.resource, naturalYield: 1 },
        amountToStore,
        'Must',
        parseInt(selectedGrape.dataset.vintage),
        selectedGrape.dataset.quality,
        selectedGrape.dataset.field,
        parseFloat(selectedGrape.dataset.prestige),
        mustStorage
      );
    }
    remainingGrapes -= amountToStore;
    if (remainingGrapes <= 0) break;
  }

  if (success) {
    const crushedAmount = totalGrapes - remainingGrapes;
    addConsoleMessage(`Crushed ${formatNumber(crushedAmount)} t of ${selectedGrape.dataset.resource} grapes from ${selectedGrape.dataset.field}`);
    inventoryInstance.removeResource(
      { name: selectedGrape.dataset.resource },
      crushedAmount,
      'Grapes',
      parseInt(selectedGrape.dataset.vintage),
      selectedGrape.dataset.storage
    );
    inventoryInstance.save();
    showWineryOverlay();
    showCrushingOverlay();
    removeOverlay();
  }

  function removeOverlay() {
    const overlay = document.querySelector('.overlay');
    if (overlay) {
      document.body.removeChild(overlay);
    }
  }
}

export function showCrushingOverlay() {
  const overlayContainer = createOverlayStructure();
  document.body.appendChild(overlayContainer);

  populateTables(overlayContainer);

  const crushBtn = overlayContainer.querySelector('.crush-btn');
  crushBtn.addEventListener('click', () => {
    const selectedGrape = overlayContainer.querySelector('.grape-select:checked');
    const selectedMustStorages = overlayContainer.querySelectorAll('input[name="must-storage"]:checked');

    if (selectedMustStorages.length === 0) {
      addConsoleMessage("Please select at least one storage container for the must");
      return false;
    }

    const totalGrapes = parseFloat(selectedGrape.dataset.amount);
    let totalAvailableSpace = 0;
    selectedMustStorages.forEach(storage => {
      totalAvailableSpace += parseFloat(storage.dataset.available);
    });

    if (totalGrapes > totalAvailableSpace) {
      const warningModal = document.createElement('div');
      warningModal.className = 'modal fade';
      warningModal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content overlay-section">
            <div class="modal-header card-header">
              <h3 class="modal-title">Warning: Limited Container Capacity</h3>
              <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
              <p>Selected containers only have total capacity for ${totalAvailableSpace >= 1000 ? formatNumber(totalAvailableSpace / 1000, 2) + ' t' : formatNumber(totalAvailableSpace) + ' l'} out of ${totalGrapes >= 1000 ? formatNumber(totalGrapes / 1000, 2) + ' t' : formatNumber(totalGrapes) + ' l'}.</p>
              <p>Do you want to crush what fits in the containers?</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="overlay-section-btn" data-dismiss="modal">Cancel</button>
              <button type="button" class="overlay-section-btn" id="confirmCrush">Crush Available</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(warningModal);
      $(warningModal).modal('show');

      document.getElementById('confirmCrush').addEventListener('click', () => {
        handleCrushing(overlayContainer, totalGrapes, totalAvailableSpace, selectedGrape, selectedMustStorages);
        $(warningModal).modal('hide');
        warningModal.remove();
        const overlay = document.querySelector('.overlay');
        if (overlay) {
          document.body.removeChild(overlay);
        }
      });

      warningModal.addEventListener('hidden.bs.modal', () => {
        warningModal.remove();
      });
    } else {
      handleCrushing(overlayContainer, totalGrapes, totalAvailableSpace, selectedGrape, selectedMustStorages);
    }
  });

  const closeBtn = overlayContainer.querySelector('.close-btn');
  closeBtn.addEventListener('click', removeOverlay);

  function removeOverlay() {
    const overlay = document.querySelector('.overlay');
    if (overlay) {
      document.body.removeChild(overlay);
    }
  }
}
