// js/overlays/plantingOverlay.js

import { formatNumber } from './utils.js';

export function showPlantingOverlay(farmland, onPlantCallback) {
  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'overlay';

  const basePlantsPerAcre = 1000; // Updated base amount of plants per acre
  const baseCostPerAcre = 2000; // Updated base cost per acre

  overlayContainer.innerHTML = `
    <div class="overlay-content">
      <h2>Planting Options for ${farmland.name}</h2>
      <div class="form-group">
        <label for="density-slider" class="form-label">Select Planting Density:</label>
        <div class="d-flex align-items-center">
          <span class="mr-2">Low</span>
          <input type="range" class="custom-range" id="density-slider" min="1" max="10" step="1" value="5">
          <span class="ml-2">High</span>
        </div>
        <div>
          Selected density: <span id="density-value">5</span>
        </div>
      </div>
      <div class="density-details d-flex justify-content-between">
        <div class="planting-overlay-info-box">
          <span>Plants/acre: </span><span id="plants-per-acre">${formatNumber(basePlantsPerAcre * 5)}</span>
        </div>
        <div class="planting-overlay-info-box">
          <span>Cost/acre: </span><span id="cost-per-acre">${formatNumber(baseCostPerAcre * 5)}</span>
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

    plantsPerAcreDisplay.textContent = formatNumber(basePlantsPerAcre * densityValue);
    costPerAcreDisplay.textContent = formatNumber(baseCostPerAcre * densityValue);
  });

  const plantButton = overlayContainer.querySelector('.plant-btn');
  plantButton.addEventListener('click', () => {
    const selectedDensity = densitySlider.value;
    onPlantCallback(selectedDensity);
    removeOverlay();
  });

  const closeButton = overlayContainer.querySelector('.close-btn');
  closeButton.addEventListener('click', (event) => {
    event.stopPropagation();
    removeOverlay();
  });

  overlayContainer.addEventListener('click', (event) => {
    if (event.target === overlayContainer) {
      removeOverlay();
    }
  });

  function removeOverlay() {
    document.body.removeChild(overlayContainer);
  }
}