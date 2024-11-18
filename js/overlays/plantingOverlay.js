// js/overlays/plantingOverlay.js
import { formatNumber } from '../utils.js';

export function showPlantingOverlay(farmland, onPlantCallback) {
  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'overlay';

  let density = farmland.density; // Initialize density with current value
  let costPerAcre = density * 2; // Cost is twice the number of plants for simplicity

  overlayContainer.innerHTML = `
    <div class="overlay-content">
      <h2>Planting Options for ${farmland.name}</h2>
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
          <span>Cost/acre: </span><span id="cost-per-acre">${formatNumber(costPerAcre)}</span>
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

  densitySlider.addEventListener('input', () => {
    const densityValue = densitySlider.value;
    densityValueDisplay.textContent = densityValue;

    plantsPerAcreDisplay.textContent = formatNumber(densityValue);
    costPerAcreDisplay.textContent = formatNumber(densityValue * 2);
  });

  const plantButton = overlayContainer.querySelector('.plant-btn');
  plantButton.addEventListener('click', () => {
    const selectedDensity = densitySlider.value;
    farmland.density = selectedDensity; // Update the farmland's density

    // Save updated farmland changes in localStorage
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const updatedFarmlandIndex = farmlands.findIndex(f => f.id === farmland.id);

    if (updatedFarmlandIndex !== -1) {
      farmlands[updatedFarmlandIndex].density = selectedDensity;
      localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
    }

    onPlantCallback(selectedDensity);    
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