
import { getBuildingTools } from '../buildings.js';
import { addConsoleMessage } from '/js/console.js';

export function showBuildingOverlay(building) {
  const overlay = document.getElementById('buildingOverlay');
  const details = document.getElementById('building-details');

  if (details && overlay) {
    const tools = getBuildingTools().filter(tool => tool.buildingType === building.name);

    const toolButtons = tools.map(tool => `
      <button class="add-tool-button" data-tool-name="${tool.name}">Add ${tool.name}</button>
    `).join('');

    const buildingDetails = `
      <h2>${building.name}</h2>
      <p>Capacity: ${building.capacity}</p>
      <p>Contents: ${building.listContents()}</p>
      ${toolButtons}
    `;

    details.innerHTML = buildingDetails;

    tools.forEach(tool => {
      const button = document.querySelector(`.add-tool-button[data-tool-name="${tool.name}"]`);
      if (button) {
        button.addEventListener('click', () => {
          if (building.addContent(tool)) {
            addConsoleMessage(`${tool.name} added to ${building.name}.`);
            showBuildingOverlay(building);
          } else {
            addConsoleMessage(`Cannot add ${tool.name}. ${building.name} is full!`);
          }
        });
      }
    });

    overlay.style.display = 'flex';
  }
}

export function hideBuildingOverlay() {
  const overlay = document.getElementById('buildingOverlay');
  if (overlay) {
    overlay.style.display = 'none'; // Hide the overlay
  }
}