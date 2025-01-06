
import { formatNumber } from '../utils.js';
import { addTransaction } from '../finance.js';
import { addConsoleMessage } from '../console.js';
import { allResources } from '/js/resource.js';

export function showPlantingOverlay(farmland, onPlantCallback) {
  // Check if field is already planted
  if (farmland.plantedResourceName) {
    addConsoleMessage(`Field <strong>${farmland.name}</strong> is already fully planted.`);
    return;
  }

  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'overlay';

  let density = farmland.density || 1000; // Default density if not set
  const initialCostPerAcre = density * 2;
  const initialTotalCost = initialCostPerAcre * farmland.acres;

  // Create planting options dropdown
  const plantingOptions = allResources.map(resource => 
    `<option value="${resource.name}">${resource.name}</option>`
  ).join('');

  overlayContainer.innerHTML = `
    <div class="overlay-content">
      <h2>Planting Options for ${farmland.name}</h2>
      <div class="form-group">
        <label for="resource-select" class="form-label">Select Resource to Plant:</label>
        <select class="form-control" id="resource-select">
          <option value="">Select Resource</option>
          ${plantingOptions}
        </select>
      </div>
      <div class="form-group">
        <label for="density-slider" class="form-label">Select Planting Density (Plants/Acre):</label>
        <div class="d-flex align-items-center">
          <span class="mr-2">Low</span>
          <input type="range" class="custom-range" id="density-slider" min="1000" max="10000" step="1000" value="${density}">
          <span class="ml-2">High</span>
        </div>
        <div>
          Selected density: <span id="density-value">${density}</span> plants/acre
        </div>
      </div>
      <div class="density-details d-flex justify-content-between">
        <div class="planting-overlay-info-box">
          <span>Plants/acre: </span><span id="plants-per-acre">${formatNumber(density)}</span>
        </div>
        <div class="planting-overlay-info-box">
          <span>Cost/acre: </span><span id="cost-per-acre">${formatNumber(initialCostPerAcre)}</span>
        </div>
        <div class="planting-overlay-info-box">
          <span>Total Cost: </span><span id="total-cost">${formatNumber(initialTotalCost)}</span>
        </div>
      </div>
      <button class="btn btn-primary plant-btn">Plant</button>
      <button class="btn btn-secondary close-btn">Close</button>
    </div>
  `;

  document.body.appendChild(overlayContainer);

  const densitySlider = overlayContainer.querySelector('#density-slider');
  const densityValueDisplay = overlayContainer.querySelector('#density-value');
  const plantsPerAcreDisplay = overlayContainer.querySelector('#plants-per-acre');
  const costPerAcreDisplay = overlayContainer.querySelector('#cost-per-acre');
  const totalCostDisplay = overlayContainer.querySelector('#total-cost');

  densitySlider.addEventListener('input', () => {
    const densityValue = parseInt(densitySlider.value, 10);
    densityValueDisplay.textContent = densityValue;
    plantsPerAcreDisplay.textContent = formatNumber(densityValue);
    const costPerAcre = densityValue * 2;
    costPerAcreDisplay.textContent = formatNumber(costPerAcre);
    const totalCost = costPerAcre * farmland.acres;
    totalCostDisplay.textContent = formatNumber(totalCost);
  });

  const plantButton = overlayContainer.querySelector('.plant-btn');
  plantButton.addEventListener('click', () => {
    const selectedDensity = parseInt(densitySlider.value, 10);
    const selectedResource = document.getElementById('resource-select').value;

    if (!selectedResource) {
      addConsoleMessage('Please select a resource to plant');
      return;
    }

    // Get all farmlands and update the specific one
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const updatedFarmlandIndex = farmlands.findIndex(f => f.id === farmland.id);

    if (updatedFarmlandIndex !== -1) {
      // Update both density and planted resource
      farmlands[updatedFarmlandIndex].density = selectedDensity;
      farmlands[updatedFarmlandIndex].plantedResourceName = selectedResource;
      localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));

      // Calculate and process the planting cost
      const totalCost = selectedDensity * 2 * farmland.acres;
      addTransaction('Expense', `Planting on ${farmland.name}`, -totalCost);

      // Add console message for successful planting
      addConsoleMessage(`Field <strong>${farmland.name}</strong> fully planted with <strong>${farmland.plantedResourceName}</strong>.`);

      onPlantCallback(selectedDensity);
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
