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
    </div>
  `;

  document.body.appendChild(overlayContainer);

  const harvestButton = overlayContainer.querySelector('.harvest-btn');

  harvestButton.addEventListener('click', () => {
    const selectedTool = overlayContainer.querySelector('#tool-select').value;

    // Pass selectedTool along with other parameters
    handleGenericTask(
      'Harvesting',
      (task, mode) => fieldTaskFunction(task, mode, 'Harvesting', { fieldId: index, storage: selectedTool }),
      { fieldId: index, storage: selectedTool } // Pass selectedTool here
    );

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