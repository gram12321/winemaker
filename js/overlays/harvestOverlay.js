import { getBuildingTools } from '../buildings.js'; 
import { handleGenericTask } from '../administration.js'; 
import { fieldTaskFunction } from '../farmland.js'; 

export function showHarvestOverlay(vineyard, index) {
  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'overlay';

  const availableTools = getBuildingTools().filter(tool => tool.capacity > 0);
  const toolOptions = availableTools.map(tool => `<option value="${tool.name}">${tool.name} (Capacity: ${tool.capacity})</option>`).join('');

  overlayContainer.innerHTML = `
    <div class="overlay-content">
      <h2>Harvest Options for ${vineyard.name}</h2>
      <label for="tool-select">Select Tool:</label>
      <select id="tool-select">
        ${toolOptions}
      </select>
      <button class="btn btn-success harvest-btn">Start Harvest</button>
      <button class="btn btn-secondary close-btn">Close</button>
      <div id="error-message" style="color: red; display: none;"></div>
    </div>
  `;

  document.body.appendChild(overlayContainer);

  const harvestButton = overlayContainer.querySelector('.harvest-btn');

  harvestButton.addEventListener('click', () => {
    const selectedTool = overlayContainer.querySelector('#tool-select').value;

    // Fetch player inventory
    const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];

    // Log the player inventory for debugging
    console.log('Player Inventory:', playerInventory);

    const resourceMatches = playerInventory.filter(item => 
      item.storage === selectedTool && 
      item.fieldName === vineyard.name && 
      item.vintage === vineyard.vintage // Match the actual vintage of the vineyard
    );

    // Log the resources that match the selection criteria
    console.log('Matching Resources:', resourceMatches);

    // Check if there are resources available matching the criteria
    if (resourceMatches.length === 0) {
      const errorMessage = overlayContainer.querySelector('#error-message');
      errorMessage.textContent = "No available resources or empty containers for the selected tool.";
      errorMessage.style.display = "block"; // Show error message
      console.log('Error: No matching resources found.');
      return; // Early exit if no valid resources
    }

    // Pass selectedTool along with other parameters
    handleGenericTask(
      'Harvesting',
      (task, mode) => fieldTaskFunction(task, mode, 'Harvesting', { fieldId: index, storage: selectedTool }),
      { fieldId: index, storage: selectedTool } // Pass selectedTool here
    );

    console.log('Harvesting process initiated for tool:', selectedTool);
    removeOverlay();
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