
import { getBuildingTools } from '../buildings.js';
import { populateStorageTable } from '../resource.js';
import { addConsoleMessage } from '../console.js';
import { farmlandYield, canHarvest } from '../vineyard.js';
import { inventoryInstance } from '../resource.js';
import { formatNumber } from '../utils.js';
import { saveInventory } from '../database/adminFunctions.js';

// Function to handle harvest logic
function harvest(farmland, farmlandId, selectedTool) {
  if (!canHarvest(farmland, selectedTool)) {
    return false;
  }

  const storage = getBuildingTools().find(tool => tool.name === selectedTool.split(' #')[0]);
  const gameYear = parseInt(localStorage.getItem('year'), 10);
  
  const harvestYield = farmlandYield(farmland);
  const totalHarvest = harvestYield;
  const quality = ((farmland.annualQualityFactor + farmland.ripeness) / 2).toFixed(2);

  // Add harvested grapes to inventory
  inventoryInstance.addResource(
    farmland.plantedResourceName,
    totalHarvest,
    'Grapes',
    gameYear,
    quality,
    farmland.name,
    farmland.farmlandPrestige,
    selectedTool
  );

  // Update farmland status
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  const farmlandToUpdate = farmlands.find(f => f.id === parseInt(farmlandId));
  if (farmlandToUpdate) {
    farmlandToUpdate.ripeness = 0;
    farmlandToUpdate.status = 'Harvested';
    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
  }

  saveInventory();
  addConsoleMessage(`Harvested ${formatNumber(totalHarvest)} kg of ${farmland.plantedResourceName} with quality ${quality} from ${farmland.name}`);
  return true;
}

// Function to show harvest overlay UI
export function showHarvestOverlay(farmland, farmlandId) {
  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'overlay';

  overlayContainer.innerHTML = `
    <div class="overlay-content">
      <h2>Harvest Options for ${farmland.name}</h2>
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
        <tbody id="storage-display-body">
        </tbody>
      </table>
      <button class="btn btn-success harvest-btn">Harvest</button>
      <button class="btn btn-secondary close-btn">Close</button>
    </div>
  `;

  document.body.appendChild(overlayContainer);
  populateStorageTable('storage-display-body', true);

  overlayContainer.querySelector('.harvest-btn').addEventListener('click', () => {
    const selectedRadio = overlayContainer.querySelector('input[name="tool-select"]:checked');
    if (!selectedRadio) {
      addConsoleMessage('Please select a storage container for harvesting');
      return;
    }

    const harvestCheck = canHarvest(farmland, selectedRadio.value);
    if (harvestCheck.warning) {
      const expectedYield = farmlandYield(farmland);
      // Create warning modal
      const warningModal = document.createElement('div');
      warningModal.className = 'modal fade';
      warningModal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Warning: Limited Container Capacity</h5>
              <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
              <p>Container only has capacity for ${formatNumber(harvestCheck.availableCapacity)}kg out of expected ${formatNumber(expectedYield)}kg.</p>
              <p>Do you want to harvest what fits in the container?</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="confirmHarvest">Harvest Available</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(warningModal);
      
      // Initialize modal
      $(warningModal).modal('show');
      
      // Handle confirmation
      document.getElementById('confirmHarvest').addEventListener('click', () => {
        if (harvest(farmland, farmlandId, selectedRadio.value, harvestCheck.availableCapacity)) {
          $(warningModal).modal('hide');
          warningModal.remove();
          removeOverlay();
        }
      });
      
      // Clean up modal on close
      warningModal.addEventListener('hidden.bs.modal', () => {
        warningModal.remove();
      });
    } else if (harvestCheck.warning === false) {
      if (harvest(farmland, farmlandId, selectedRadio.value)) {
        removeOverlay();
      }
    }
  });

  const closeButton = overlayContainer.querySelector('.close-btn');
  closeButton.addEventListener('click', removeOverlay);
  overlayContainer.addEventListener('click', (event) => {
    if (event.target === overlayContainer) removeOverlay();
  });

  function removeOverlay() {
    document.body.removeChild(overlayContainer);
  }
}
