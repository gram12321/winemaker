import { formatNumber, getFlagIconHTML, getColorClass } from '../utils.js';
import { addTransaction } from '../finance.js';
import { addConsoleMessage } from '../console.js';
import { allResources } from '/js/resource.js';
import { displayFarmland  } from '../overlays/mainpages/landoverlay.js';
import { updateFarmland } from '../database/adminFunctions.js';
import taskManager, { TaskType } from '../taskManager.js';
import { regionAltitudeRanges } from '../names.js';
import { hideOverlay, showStandardOverlay, setupStandardOverlayClose } from './overlayUtils.js';

// Show the planting overlay
export function showPlantingOverlay(farmland, onPlantCallback) {
  if (farmland.plantedResourceName) {
    addConsoleMessage(`Field <strong>${getFlagIconHTML(farmland.country)} ${farmland.name}</strong> is already fully planted.`);
    return;
  }

  const overlayContainer = showStandardOverlay(createPlantingOverlayHTML(farmland));
  setupPlantingEventListeners(overlayContainer, farmland, onPlantCallback);
}

// Create the HTML for the overlay
function createPlantingOverlayHTML(farmland) {
  const density = farmland.density || 1000;
  const initialCostPerAcre = density * 2;
  const initialTotalCost = initialCostPerAcre * farmland.acres;
  const plantingOptions = allResources.map(resource => 
    `<option value="${resource.name}">${resource.name}</option>`
  ).join('');

  return `
    <div class="overlay-content overlay-container">
      <section class="overlay-section card mb-4">
        <div class="card-header text-white d-flex justify-content-between align-items-center">
          <h3 class="h5 mb-0">Planting Options for ${getFlagIconHTML(farmland.country)} ${farmland.name}</h3>
          <button class="btn btn-light btn-sm close-btn">Close</button>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label for="resource-select" class="form-label">Select Resource to Plant:</label>
            <select class="form-control form-control-sm" id="resource-select">
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
          <div class="d-flex justify-content-center mt-4">
            <button class="btn btn-primary plant-btn">Plant</button>
          </div>
        </div>
      </section>
    </div>
  `;
}

// Set up all event listeners
function setupPlantingEventListeners(overlayContainer, farmland, onPlantCallback) {
  setupDensitySlider(overlayContainer, farmland);
  setupPlantButton(overlayContainer, farmland, onPlantCallback);
  setupCloseButton(overlayContainer);
}


// Function to handle planting logic
function plant(farmland, selectedResource, selectedDensity) {
  if (!selectedResource) {
    addConsoleMessage('Please select a resource to plant', false, true);
    return false;
  }

    // Calculate planting cost
  const totalCost = selectedDensity * 2 * farmland.acres;
  const currentMoney = parseFloat(localStorage.getItem('money') || '0');

  // Check if enough money is available
  if (currentMoney < totalCost) {
    addConsoleMessage(`Insufficient funds for planting. Required: <strong>${formatNumber(totalCost)}€</strong>, Available: <strong>${formatNumber(currentMoney)}€</strong>`, false, true);
    return false;
  }

  // Get the resource object to check its properties
  const resourceObj = allResources.find(r => r.name === selectedResource);
  // Calculate density multiplier: 1.0 at 1000 vines/acre, increasing by 0.1 for each 1000 additional vines
  const densityMultiplier = 1 + Math.max(0, (selectedDensity - 1000) / 1000) * 0.1;
  const fragilePenalty = (1 - resourceObj.fragile) * 0.5 * densityMultiplier; // More fragile = higher penalty, multiplied by density factor

  // Calculate altitude penalty
  const [minAltitude, maxAltitude] = regionAltitudeRanges[farmland.country][farmland.region];
  const medianAltitude = (minAltitude + maxAltitude) / 2;
  const altitudeDeviation = (farmland.altitude - medianAltitude) / (maxAltitude - minAltitude);
  const altitudePenalty = altitudeDeviation * 0.5; // 5% extra work for every 10% deviation above median, 5% less work for every 10% deviation below median

  // Calculate total work based on density and acres, including altitude penalty
  const vinesPerAcre = selectedDensity;
  const totalVines = vinesPerAcre * farmland.acres;
  const totalStandardWorkWeek = totalVines / 3500; // How many weeks of work for a single worker capable of planting 500 vines per day (3500 per week)
  const totalWork = totalStandardWorkWeek * 50 * (1 + altitudePenalty + fragilePenalty); // Multiply by 50 to convert standardWeekofWork into workunits, then apply altitude penalty

  // Add detailed console message about work calculation
  addConsoleMessage(`Work calculation for ${getFlagIconHTML(farmland.country)} ${farmland.name}:
    - Vines per acre: ${formatNumber(vinesPerAcre)}
    - Total vines: ${formatNumber(totalVines)}
    - Standard work weeks: ${formatNumber(totalStandardWorkWeek, 2)} (${formatNumber(totalVines)} vines ÷ 3500 vines per week)
    - Work units before penalties: ${formatNumber(totalStandardWorkWeek * 50, 1)} (${formatNumber(totalStandardWorkWeek, 2)} weeks × 50 units)
    - Altitude deviation: ${formatNumber(altitudeDeviation * 100, 1)}% (${altitudePenalty >= 0 ? '+' : '-'}${formatNumber(Math.abs(altitudePenalty * 100), 1)}% work)
    - Fragility penalty: +${formatNumber(fragilePenalty * 100, 1)}% (Base: ${formatNumber((1 - resourceObj.fragile) * 50, 1)}% × Density multiplier: ${formatNumber(densityMultiplier, 2)})
    - Final work units: ${formatNumber(totalWork, 1)} (${formatNumber(totalStandardWorkWeek * 50, 1)} × ${formatNumber(1 + altitudePenalty + fragilePenalty, 2)})`);

  // Since planting is a progressive task, we use addProgressiveTask
  taskManager.addProgressiveTask(
    'Planting',
    TaskType.field,
    totalWork,
    (target, progress, params) => {
      // This will be called every week with updated progress
      const percentComplete = Math.floor(progress * 100);
      const percentCompleteClass = getColorClass(progress);
      addConsoleMessage(`Planting ${getFlagIconHTML(target.country)} ${target.name}: <span class="${percentCompleteClass}">${percentComplete}%</span> complete...`, true);
      
      if (progress >= 1) {
        // Final update when task completes
        finalizePlanting(target, params);
      }
    },
    farmland,
    { selectedResource, selectedDensity, totalCost },
    // Initial callback
    (target, params) => {
      updateFarmland(target.id, {
        status: 'Planting...'
      });
      displayFarmland();
    }
  );

  return true;
}

export function finalizePlanting(target, params) {
    const { selectedResource, selectedDensity, totalCost } = params;
    updateFarmland(target.id, {
        density: selectedDensity,
        plantedResourceName: selectedResource,
        vineAge: 0,
        status: 'No yield in first season'
    });
    addTransaction('Expense', `Planting on ${getFlagIconHTML(target.country)} ${target.name}`, -totalCost);
    displayFarmland();
}

function setupDensitySlider(overlayContainer, farmland) {
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
}

function setupPlantButton(overlayContainer, farmland, onPlantCallback) {
  const plantButton = overlayContainer.querySelector('.plant-btn');
  plantButton.addEventListener('click', () => {
    const selectedDensity = parseInt(overlayContainer.querySelector('#density-slider').value, 10);
    const selectedResource = overlayContainer.querySelector('#resource-select').value;

    if (plant(farmland, selectedResource, selectedDensity)) {
      // Force a UI refresh by reloading the farmlands
      const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
      const updatedFarmlandIndex = farmlands.findIndex(f => f.id === farmland.id);
      if (updatedFarmlandIndex !== -1) {
        farmland = farmlands[updatedFarmlandIndex];
      }
      onPlantCallback(selectedDensity);
      hideOverlay(overlayContainer);
      // Refresh the display
      displayFarmland();
    }
  });
}

function setupCloseButton(overlayContainer) {
  setupStandardOverlayClose(overlayContainer);
}