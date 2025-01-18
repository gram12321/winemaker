import { formatNumber } from '../utils.js';
import { addTransaction } from '../finance.js';
import { addConsoleMessage } from '../console.js';
import { allResources } from '/js/resource.js';
import { displayFarmland  } from '/js/farmland.js';
import { updateFarmland } from '../database/adminFunctions.js';
import taskManager, { TaskType } from '../taskManager.js';

// Function to handle planting logic
function plant(farmland, selectedResource, selectedDensity) {
  if (!selectedResource) {
    addConsoleMessage('Please select a resource to plant', false, true);
    return false;
  }

  if (!farmland || typeof farmland.id === 'undefined') {
    addConsoleMessage('Invalid farmland data', false, true);
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

  // Calculate total work based on density and acres
  const vinesPerAcre = selectedDensity;
  const totalVines = vinesPerAcre * farmland.acres;
  const workPerVine = 1 / 500; // Assuming 500 vines planted per day by a single worker
  const totalWork = totalVines * workPerVine * 50; // Convert to total work units (50 work units per week)

  // Since planting is a progressive task, we use addProgressiveTask
  taskManager.addProgressiveTask(
    'Planting',
    TaskType.field,
    totalWork,
    (target, progress, params) => {
      // This will be called every week with updated progress
      const percentComplete = Math.floor(progress * 100);
      addConsoleMessage(`Planting ${target.name}: ${percentComplete}% complete...`, true);
      
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
    addTransaction('Expense', `Planting on ${target.name}`, -totalCost);
    displayFarmland();
}

// Function to show planting overlay UI
export function showPlantingOverlay(farmland, onPlantCallback) {
  // Check if field is already planted
  if (farmland.plantedResourceName) {
    addConsoleMessage(`Field <strong>${farmland.name}</strong> is already fully planted.`);
    return;
  }

  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'overlay planting-overlay';

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
      <button class="btn btn-primary plant-btn">Plant</button>
      <button class="btn btn-secondary close-btn">Close</button>
    </div>
  `;

  document.body.appendChild(overlayContainer);

  // Setup event listeners
  setupDensitySlider(overlayContainer, farmland);
  setupPlantButton(overlayContainer, farmland, onPlantCallback);
  setupCloseButton(overlayContainer);
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
      removeOverlay(overlayContainer);
      // Refresh the display
      displayFarmland();
    }
  });
}

function setupCloseButton(overlayContainer) {
  const closeButton = overlayContainer.querySelector('.close-btn');
  closeButton.addEventListener('click', () => removeOverlay(overlayContainer));
  overlayContainer.addEventListener('click', (event) => {
    if (event.target === overlayContainer) removeOverlay(overlayContainer);
  });
}

function removeOverlay(overlayContainer) {
  document.body.removeChild(overlayContainer);
}
