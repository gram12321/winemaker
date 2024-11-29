// js/overlays/harvestOverlay.js
import { handleGenericTask } from '../administration.js'; // Import handleGenericTask for tasks
import { fieldTaskFunction } from '../farmland.js';

export function showHarvestOverlay(vineyard, index) {
  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'overlay';

  overlayContainer.innerHTML = `
    <div class="overlay-content">
      <h2>Harvest Options for ${vineyard.name}</h2>
      <button class="btn btn-success harvest-btn">Start Harvest</button>
      <button class="btn btn-secondary close-btn">Close</button>
    </div>
  `;

  document.body.appendChild(overlayContainer);

  const harvestButton = overlayContainer.querySelector('.harvest-btn');
  harvestButton.addEventListener('click', () => {
    // Start the harvesting task
    handleGenericTask(
      'Harvesting',
      (task, mode) => fieldTaskFunction(task, mode, 'Harvesting', { fieldId: index }),
      { fieldId: index }
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