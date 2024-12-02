import { getBuildingTools } from '../buildings.js'; 
import { handleGenericTask } from '../administration.js'; 
import { fieldTaskFunction } from '../farmland.js'; 
import { populateStorageTable } from '../resource.js'; // Importing populateStorageTable

export function showHarvestOverlay(vineyard, index) {
  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'overlay';

  const availableTools = getBuildingTools().filter(tool => tool.capacity > 0);
  const toolOptions = availableTools.map(tool => 
    `<option value="${tool.name}">${tool.name} (Capacity: ${tool.capacity})</option>`
  ).join('');

  overlayContainer.innerHTML = `
    <div class="overlay-content">
      <h2>Harvest Options for ${vineyard.name}</h2>
      <label for="tool-select">Select Tool:</label>
      <select id="tool-select">
        ${toolOptions}
      </select>

      <!-- Storage table starts here -->
      <table class="table table-bordered">
        <thead>
          <tr>
              <th>Container</th>
              <th>Capacity</th>
              <th>Resource</th>
              <th>Amount</th>
              <th>Quality</th>
              <th>Status</th>
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

  // Function to display storage options based on selected tool
  function updateStorageDisplay() {
    const selectedTool = overlayContainer.querySelector('#tool-select').value;
    const storageDisplayBody = overlayContainer.querySelector('#storage-display-body');
    storageDisplayBody.innerHTML = ''; // Clear previous display

    // Populate the storage table based on the selected tool
    populateStorageTable('storage-display-body');  // Call populateStorageTable to update display
  }

  // Initialize storage display on tool change
  overlayContainer.querySelector('#tool-select').addEventListener('change', updateStorageDisplay);

  // Initial call to display storage based on the default selected tool
  updateStorageDisplay();

  // Event listener for the harvest button
  overlayContainer.querySelector('.harvest-btn').addEventListener('click', () => {
    const selectedTool = overlayContainer.querySelector('#tool-select').value;

    // Pass selectedTool along with other parameters
    handleGenericTask(
      'Harvesting',
      (task, mode) => fieldTaskFunction(task, mode, 'Harvesting', { fieldId: index, storage: selectedTool }),
      { fieldId: index, storage: selectedTool }
    );

    removeOverlay();
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