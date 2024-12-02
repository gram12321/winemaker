import { getBuildingTools } from '../buildings.js'; 
import { handleGenericTask } from '../administration.js'; 
import { fieldTaskFunction } from '../farmland.js'; 
import { populateStorageTable } from '../resource.js'; // Importing populateStorageTable
import { storeBuildings, loadBuildings } from '/js/database/adminFunctions.js';

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

  // Function to update storage display for the selected tool
  function updateStorageDisplay() {
    populateStorageTable('storage-display-body', true); // Ensure populated table excludes Quality and Status
  }

  // Event listener for the harvest button
  overlayContainer.querySelector('.harvest-btn').addEventListener('click', () => {
    const selectedRadio = overlayContainer.querySelector('input[name="tool-select"]:checked');
    if (selectedRadio) {
      const selectedTool = selectedRadio.value;

      // Ensure the selected storage is getting the selected tool name and number
      handleGenericTask(
          'Harvesting',
          (task, mode) => fieldTaskFunction(task, mode, 'Harvesting', { fieldId: index, storage: selectedTool }),
          { fieldId: index, storage: selectedTool } // Pass the correct stored value from tool selection
      );
      removeOverlay();
    } else {
      alert('Please select a tool to proceed with harvesting.');
    }
  });

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