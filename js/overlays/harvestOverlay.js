import { getBuildingTools } from '../buildings.js'; 
import { populateStorageTable } from '../resource.js';
import { addConsoleMessage } from '../console.js';
import { farmlandYield } from '../farmland.js';

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

    const selectedTool = selectedRadio.value;
    const storage = getBuildingTools().find(tool => tool.name === selectedTool.split(' #')[0]);
    
    if (!storage) {
      addConsoleMessage('Invalid storage container selected');
      return;
    }

    // Get current inventory for this container
    const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
    const containerInventory = playerInventory.find(item => item.storage === selectedTool);

    // Check if container is full
    if (containerInventory && containerInventory.amount >= storage.capacity) {
      addConsoleMessage('Selected container is full');
      return;
    }

    // Call harvest function and update farmland
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const farmlandToHarvest = farmlands.find(f => f.id === parseInt(farmlandId));
    
    if (farmlandToHarvest) {
      let harvestedAmount = farmlandYield(farmlandToHarvest);
      if(harvestedAmount === undefined) harvestedAmount = 0;
      
      // Calculate quality based on annual quality factor and ripeness
      const quality = ((farmlandToHarvest.annualQualityFactor + farmlandToHarvest.ripeness) / 2).toFixed(2);
      
      farmlandToHarvest.ripeness = 0;
      
      // Update container inventory
      if (containerInventory) {
        containerInventory.amount += harvestedAmount;
        containerInventory.quality = parseFloat(quality);
      } else {
        playerInventory.push({
          resource: { name: farmlandToHarvest.plantedResourceName },
          amount: harvestedAmount,
          storage: selectedTool,
          fieldName: farmlandToHarvest.name,
          vintage: localStorage.getItem('year'),
          quality: parseFloat(quality),
          state: 'Grapes'
        });
      }

      localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
      localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
      
      addConsoleMessage(`Harvested ${harvestedAmount.toFixed(2)} kg from ${farmlandToHarvest.name}`);
      removeOverlay();
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