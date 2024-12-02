import { getBuildingTools } from '../buildings.js'; 
import { handleGenericTask } from '../administration.js'; 
import { fieldTaskFunction } from '../farmland.js'; 
import { populateStorageTable } from '../resource.js'; // Importing populateStorageTable
import { storeBuildings, loadBuildings } from '/js/database/adminFunctions.js';

export function showHarvestOverlay(vineyard, index) {
  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'overlay';

  // Load existing buildings from localStorage
  const buildings = loadBuildings();

  // Iterate over all buildings to collect tools for tool selection
  const toolInstances = buildings.flatMap(building =>
    building.contents.filter(tool => tool.capacity > 0) // Filter tools with capacity
  );

  // Generate dropdown options for existing tool instances
  const toolOptions = toolInstances.map(tool => 
    `<option value="${tool.name} #${tool.instanceNumber}">${tool.name} #${tool.instanceNumber}</option>`
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

  // Function to update storage display for the selected tool
  function updateStorageDisplay() {
    populateStorageTable('storage-display-body', true); // Ensure populated table excludes Quality and Status
  }

  // Initialize storage display based on tool change
  overlayContainer.querySelector('#tool-select').addEventListener('change', updateStorageDisplay);

  // Initial call to display storage based on default selected tool
  updateStorageDisplay();

  // Event listener for the harvest button
  overlayContainer.querySelector('.harvest-btn').addEventListener('click', () => {
    const selectedTool = overlayContainer.querySelector('#tool-select').value;
    // Ensure the selected storage is getting the selected tool name and number
    handleGenericTask(
        'Harvesting',
        (task, mode) => fieldTaskFunction(task, mode, 'Harvesting', { fieldId: index, storage: selectedTool }),
        { fieldId: index, storage: selectedTool } // Pass the correct stored value from tool selection
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