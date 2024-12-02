import { getBuildingTools } from '../buildings.js'; 
import { handleGenericTask } from '../administration.js'; 
import { fieldTaskFunction } from '../farmland.js'; 
import { populateStorageTable } from '../resource.js'; // Importing populateStorageTable
import { storeBuildings, loadBuildings } from '/js/database/adminFunctions.js';
import { addConsoleMessage } from '/js/console.js'; // Adding console message for debugging


export function showHarvestOverlay(vineyard, index) {
  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'overlay';

  overlayContainer.innerHTML = `
    <div class="overlay-content">
      <h2>Harvest Options for ${vineyard.name}</h2>

      <!-- Storage table starts here -->
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
          <!-- Storage resources will be dynamically generated here -->
        </tbody>
      </table>
      <!-- Storage table ends here -->

      <button class="btn btn-success harvest-btn">Start Harvest</button>
      <button class="btn btn-secondary close-btn">Close</button>
    </div>
  `;

  document.body.appendChild(overlayContainer);

  // Initialize storage display
  updateStorageDisplay();

  function updateStorageDisplay() {
    populateStorageTable('storage-display-body', true); // Populate table while excluding Quality and Status
  }

  // Event listener for the harvest button
  overlayContainer.querySelector('.harvest-btn').addEventListener('click', () => {
    const selectedRadio = overlayContainer.querySelector('input[name="tool-select"]:checked');
    if (selectedRadio) {
      const selectedTool = selectedRadio.value;
      const resourceBeingHarvested = vineyard.plantedResourceName; // Resource type being harvested
      const toolName = selectedTool.split(' #')[0]; // Parsing tool name from selected value

      // Check tool compatibility
      const matchingInventoryItems = getMatchingInventoryItems(selectedTool);
      if (matchingInventoryItems.length > 0) {
        const { resource, fieldName, vintage } = matchingInventoryItems[0];

        // Validate against resource, fieldName, and vintage
        if (resource.name !== resourceBeingHarvested || fieldName !== vineyard.name || vintage !== vineyard.vintage) {
          addConsoleMessage(`<span style="color:red;">This container cannot be used for harvesting the specified resource!</span>`);
          return; // Prevent further execution
        }
      }

      // Proceed with task if matching
      handleGenericTask(
          'Harvesting',
          (task, mode) => fieldTaskFunction(task, mode, 'Harvesting', { fieldId: index, storage: selectedTool }),
          { fieldId: index, storage: selectedTool } // Pass the correct stored value from tool selection
      );
      removeOverlay();
    } else {
      addConsoleMessage(`<span style="color:red;">Please select a tool to proceed with harvesting.</span>`);
    }
  });

  // Utility function to get matching inventory items for a selected tool
  function getMatchingInventoryItems(storage) {
    const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
    return playerInventory.filter(item => item.storage === storage);
  }

  // Event listener for the close button and overlay
  const closeButton = overlayContainer.querySelector('.close-btn');
  closeButton.addEventListener('click', removeOverlay);
  overlayContainer.addEventListener('click', (event) => {
    if (event.target === overlayContainer) removeOverlay();
  });

  function removeOverlay() {
    document.body.removeChild(overlayContainer);
  }
}