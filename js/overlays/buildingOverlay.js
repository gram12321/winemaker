// js/overlays/buildingOverlay.js


export function showBuildingOverlay(buildingName) {
  const overlay = document.getElementById('buildingOverlay');
  const details = document.getElementById('building-details');

  let buildingDetails = '';

  // Example switch statement to handle different building names
  switch (buildingName) {
    case 'Tool Shed':
      buildingDetails = `
        <h2>${buildingName}</h2>
        <p>Current Capacity: <span id="tool-shed-capacity"></span></p>
        <p>Tools: <span id="tool-shed-contents"></span></p>
        <button id="upgrade-tool-shed-btn" class="btn btn-primary">Upgrade Tool Shed</button>
        <button id="add-tractor-btn" class="btn btn-secondary">Add Tractor</button>
        <button id="add-trimmer-btn" class="btn btn-secondary">Add Trimmer</button>
      `;
      break;
    // Add cases for other buildings
    default:
      buildingDetails = `<h2>${buildingName}</h2><p>No details available.</p>`;
  }

  details.innerHTML = buildingDetails;
  overlay.style.display = 'flex'; // Display the overlay

  // Add event listeners for the Tool Shed buttons
  if (buildingName === 'Tool Shed') {
    setupToolShedUI();
  }
}

export function hideBuildingOverlay() {
  const overlay = document.getElementById('buildingOverlay');
  overlay.style.display = 'none';
}

function setupToolShedUI() {
  const capacityElement = document.getElementById('tool-shed-capacity');
  const contentsElement = document.getElementById('tool-shed-contents');
  const updateDisplay = () => {
    // Assuming toolShed is already defined in buildings.js
    capacityElement.innerHTML = `${toolShed.capacity} tools`;
    contentsElement.innerHTML = toolShed.listContents();
  };

  document.getElementById('upgrade-tool-shed-btn').addEventListener('click', () => {
    toolShed.upgradeCapacity(5);
    updateDisplay();
  });

  document.getElementById('add-tractor-btn').addEventListener('click', () => {
    if (toolShed.addContent(new Tool('Tractor'))) {
      updateDisplay();
    }
  });

  document.getElementById('add-trimmer-btn').addEventListener('click', () => {
    if (toolShed.addContent(new Tool('Trimmer'))) {
      updateDisplay();
    }
  });

  updateDisplay();
}