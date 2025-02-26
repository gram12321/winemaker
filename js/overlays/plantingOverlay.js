import { formatNumber, getFlagIconHTML, getColorClass } from '../utils.js';
import { addTransaction } from '../finance.js';
import { addConsoleMessage } from '../console.js';
import { allResources, getResourceByName } from '../resource.js';  // Add getResourceByName to import
import { updateFarmland, getFarmlands } from '../database/adminFunctions.js';
import taskManager from '../taskManager.js';
import { regionAltitudeRanges } from '../names.js';
import { hideOverlay, showStandardOverlay, setupStandardOverlayClose } from './overlayUtils.js';
import { createWorkCalculationTable } from '../components/workCalculationTable.js';
import { calculateFieldTotalWork } from '../utils/workCalculator.js';
import { updateAllDisplays } from '../displayManager.js';
import { createOverlayHTML } from '../components/createOverlayHTML.js';
import { createSlider, createSelect, createInfoBox } from '../components/createOverlayHTML.js';

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
    
    const selectOptions = allResources.map(resource => ({
        value: resource.name,
        label: resource.name
    }));

    // Calculate initial work data before using it
    const initialWorkData = calculatePlantingWorkData(farmland, density);

    const content = `
        ${createSelect({
            id: 'resource-select',
            label: 'Select Resource to Plant:',
            options: selectOptions,
            selectedValue: allResources[0].name
        })}
        
        ${createSlider({
            id: 'density-slider',
            label: 'Select Planting Density (Plants/Acre):',
            min: 1000,
            max: 10000,
            step: 1000,
            value: density,
            showValue: true,
            valuePrefix: 'Selected density: ',
            valueSuffix: ' plants/acre',
            lowLabel: 'Low Density',
            highLabel: 'High Density'
        })}
        
        <div class="density-details d-flex justify-content-between">
            ${createInfoBox({
                label: 'Plants/acre',
                value: formatNumber(density),
                id: 'plants-per-acre'
            })}
            ${createInfoBox({
                label: 'Cost/acre',
                value: formatNumber(initialCostPerAcre),
                id: 'cost-per-acre'
            })}
            ${createInfoBox({
                label: 'Total Cost',
                value: formatNumber(initialTotalCost),
                id: 'total-cost'
            })}
        </div>
        
        <div id="work-calculation-container">
            ${createWorkCalculationTable(initialWorkData)}
        </div>
    `;

    return createOverlayHTML({
        title: 'Planting Options for',
        farmland,
        content,
        buttonText: 'Plant',
        buttonClass: 'btn-primary',
        buttonIdentifier: 'plant-btn'
    });
}

// Set up all event listeners
function setupPlantingEventListeners(overlayContainer, farmland, onPlantCallback) {
  setupDensitySlider(overlayContainer, farmland);
  setupPlantButton(overlayContainer, farmland, onPlantCallback);
  setupStandardOverlayClose(overlayContainer);  // Use directly instead of through wrapper

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
function validatePlantingRequirements(selectedResource, totalCost) {
    if (!selectedResource) {
        addConsoleMessage('Please select a resource to plant', false, true);
        return false;
    }

    const currentMoney = parseFloat(localStorage.getItem('money') || '0');
    if (currentMoney < totalCost) {
        addConsoleMessage(`Insufficient funds for planting. Required: <strong>${formatNumber(totalCost)}€</strong>, Available: <strong>${formatNumber(currentMoney)}€</strong>`, false, true);
        return false;
    }

    return true;
}

function calculatePlantingCost(density, acres) {
    return density * 2 * acres;
}

function plant(farmland, selectedResource, selectedDensity) {
    const totalCost = calculatePlantingCost(selectedDensity, farmland.acres);
    
    if (!validatePlantingRequirements(selectedResource, totalCost)) {
        return false;
    }

    const workData = calculatePlantingWorkData(farmland, selectedDensity);

    taskManager.addProgressiveTask(
        'Planting',
        'field',
        workData.totalWork,
        (target, progress, params) => {
            const percentComplete = Math.floor(progress * 100);
            const percentCompleteClass = getColorClass(progress);
            addConsoleMessage(`Planting ${getFlagIconHTML(target.country)} ${target.name}: <span class="${percentCompleteClass}">${percentComplete}%</span> complete...`, true);
            
            if (progress >= 1) {
                performPlanting(target, params);
            }
        },
        farmland,
        { selectedResource, selectedDensity, totalCost },
        // Initial callback sets the "Planting..." status
        (target) => {
            updateFarmland(target.id, { status: 'Planting...' });
            updateAllDisplays();
        }
    );

    return true;
}

export function performPlanting(target, params) {
    const { selectedResource, selectedDensity, totalCost } = params;
    updateFarmland(target.id, {
        density: selectedDensity,
        plantedResourceName: selectedResource,
        vineAge: 0,
        status: 'No yield in first season',
        canBeCleared: 'Ready to be cleared'  // Add this line to set clearing status
    });
    addTransaction('Expense', `Planting on ${getFlagIconHTML(target.country)} ${target.name}`, -totalCost);
    updateAllDisplays();
}

function setupDensitySlider(overlayContainer, farmland) {
    const densitySlider = overlayContainer.querySelector('#density-slider');
    const plantsPerAcreDisplay = overlayContainer.querySelector('#plants-per-acre');
    const costPerAcreDisplay = overlayContainer.querySelector('#cost-per-acre');
    const totalCostDisplay = overlayContainer.querySelector('#total-cost');

    densitySlider.addEventListener('input', () => {
        const densityValue = parseInt(densitySlider.value, 10);
        
        // Update info boxes
        if (plantsPerAcreDisplay) {
            plantsPerAcreDisplay.textContent = formatNumber(densityValue);
        }
        
        const costPerAcre = densityValue * 2;
        if (costPerAcreDisplay) {
            costPerAcreDisplay.textContent = formatNumber(costPerAcre);
        }
        
        const totalCost = costPerAcre * farmland.acres;
        if (totalCostDisplay) {
            totalCostDisplay.textContent = formatNumber(totalCost);
        }

        // Update work calculation display
        const workData = calculatePlantingWorkData(farmland, densityValue);
        const container = overlayContainer.querySelector('#work-calculation-container');
        if (container) {
            container.innerHTML = createWorkCalculationTable(workData);
        }
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
    const totalWork = calculateFieldTotalWork(farmland.acres, {
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