import { formatNumber, getFlagIconHTML, getColorClass } from '../utils.js';
import { addTransaction } from '../finance.js';
import { addConsoleMessage } from '../console.js';
import { allResources, getResourceByName } from '../resource.js';  // Add getResourceByName to import
import { displayFarmland  } from '../overlays/mainpages/landoverlay.js';
import { updateFarmland, getFarmlands } from '../database/adminFunctions.js';
import taskManager from '../taskManager.js';
import { regionAltitudeRanges } from '../names.js';
import { hideOverlay, showStandardOverlay, setupStandardOverlayClose } from './overlayUtils.js';
import { createWorkCalculationTable } from '../components/workCalculationTable.js';
import { calculateTotalWork } from '../utils/workCalculator.js';
import { updateAllDisplays } from '../displayManager.js';

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
  
  // Create options with first option selected and trigger initial calculation
  const firstResource = allResources[0].name;
  const plantingOptions = allResources.map(resource => 
    `<option value="${resource.name}" ${resource.name === firstResource ? 'selected' : ''}>${resource.name}</option>`
  ).join('');

  // Pass the first resource for initial work calculation
  const initialWorkData = calculatePlantingWorkData(farmland, density);

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
          <div id="work-calculation-container">
            ${createWorkCalculationTable(initialWorkData)}
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

  // Add resource selection listener
  const resourceSelect = overlayContainer.querySelector('#resource-select');
  resourceSelect.addEventListener('change', () => {
    const densityValue = parseInt(overlayContainer.querySelector('#density-slider').value, 10);
    const workData = calculatePlantingWorkData(farmland, densityValue);
    const container = overlayContainer.querySelector('#work-calculation-container');
    container.innerHTML = createWorkCalculationTable(workData);
  });
}


// Function to handle planting logic
function plant(farmland, selectedResource, selectedDensity) {
  // Validation checks
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

  const workData = calculatePlantingWorkData(farmland, selectedDensity);

  // Create the progressive planting task
  taskManager.addProgressiveTask(
    'Planting',
    'field',  // Changed from TaskType.field
    workData.totalWork,
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
        status: 'No yield in first season',
        canBeCleared: 'Ready to be cleared'  // Add this line to set clearing status
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

    // Update work calculation display
    const workData = calculatePlantingWorkData(farmland, densityValue);
    const container = overlayContainer.querySelector('#work-calculation-container');
    container.innerHTML = createWorkCalculationTable(workData);
  });
}

function setupPlantButton(overlayContainer, farmland, onPlantCallback) {
  const plantButton = overlayContainer.querySelector('.plant-btn');
  plantButton.addEventListener('click', () => {
    const selectedDensity = parseInt(overlayContainer.querySelector('#density-slider').value, 10);
    const selectedResource = overlayContainer.querySelector('#resource-select').value;

    if (plant(farmland, selectedResource, selectedDensity)) {
      // Get updated farmland data from storage
      const farmlands = getFarmlands();
      const updatedFarmland = farmlands.find(f => f.id === farmland.id);
      if (updatedFarmland) {
        farmland = updatedFarmland;
      }
      onPlantCallback(selectedDensity);
      hideOverlay(overlayContainer);
      // Use displayManager to update all displays
      updateAllDisplays();
    }
  });
}

function setupCloseButton(overlayContainer) {
  setupStandardOverlayClose(overlayContainer);
}

function calculatePlantingWorkData(farmland, density) {
    const selectedResource = document.querySelector('#resource-select')?.value || allResources[0].name;
    const resource = getResourceByName(selectedResource);

    // Calculate altitude effect based on region's altitude range, 5% less work for every 10% deviation below median, 5% extra work for every 10% deviation above median
    const [minAltitude, maxAltitude] = regionAltitudeRanges[farmland.country][farmland.region];
    const medianAltitude = (minAltitude + maxAltitude) / 2;
    const altitudeDeviation = (farmland.altitude - medianAltitude) / (maxAltitude - minAltitude);
    
    // Convert effect to modifier (1 + effect), If altitude is 20% below median: -0.1 effect -> 0.9 modifier (10% less work), If altitude is 20% above median: +0.1 effect -> 1.1 modifier (10% more work)
    const altitudeEffect = farmland.altitude > medianAltitude 
        ? altitudeDeviation * 0.5  // Above median: positive effect (more work)
        : altitudeDeviation * -0.5; // Below median: negative effect (less work)
    
    // Calculate fragility effect
    const robustness = resource.fragile;  // 1.0 = fully robust, 0.4 = 40% robust. Only apply extra work for non-robust grapes, independent of density. If robustness is 1.0 (100%), fragilityEffect will be 0 (no extra work). If robustness is 0.4 (40%), fragilityEffect will be 0.6 (60% more work)
    const fragilityEffect = (1 - robustness);

    // Calculate total work
    const totalWork = calculateTotalWork(farmland.acres, {
        density: density,
        tasks: ['PLANTING'],
        workModifiers: [altitudeEffect, fragilityEffect]
    });

    return {
        acres: farmland.acres,
        density: density,
        tasks: ['Planting'],
        totalWork,
        altitude: farmland.altitude,
        altitudeEffect,
        minAltitude,
        maxAltitude,
        medianAltitude,
        robustness,
        fragilityEffect
    };
}