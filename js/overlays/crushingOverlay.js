import { formatNumber, getColorClass } from '../utils.js';
import { addConsoleMessage } from '../console.js';
import { showWineryOverlay } from './mainpages/wineryoverlay.js';
import { inventoryInstance } from '../resource.js';
import taskManager from '../taskManager.js';
import { showModalOverlay, hideOverlay } from './overlayUtils.js';
import { getBuildingTools  } from '../buildings.js';
import { loadBuildings, storeBuildings, loadInventory } from '../database/adminFunctions.js';
import { createOverlayHTML, createTable, createMethodSelector, createCheckbox } from '../components/createOverlayHTML.js';
import { calculateTotalWork } from '../utils/workCalculator.js';
import { createWorkCalculationTable } from '../components/workCalculationTable.js';
import { calculateCrushingCharacteristics } from '../utils/crushingCharacteristics.js';

export function showCrushingOverlay() {
    const overlayContent = createCrushingHTML();
    const overlay = showModalOverlay('crushingOverlay', overlayContent);
    if (overlay) {
        setupCrushingEventListeners(overlay);
        populateTables(overlay);
    }
    return overlay;
}

function updateGrapeImage(resourceName) {
    const grapeImage = document.querySelector('.crushing-input-image');
    if (!grapeImage) return;

    if (resourceName) {
        // Try to load specific grape icon
        const specificPath = `/assets/icon/grape/icon_${resourceName.toLowerCase()}.webp`;
        // Test if specific image exists
        fetch(specificPath)
            .then(response => {
                if (response.ok) {
                    grapeImage.src = specificPath;
                } else {
                    grapeImage.src = '/assets/pic/grapes.webp'; // Fallback to generic
                }
            })
            .catch(() => {
                grapeImage.src = '/assets/pic/grapes.webp'; // Fallback to generic
            });
    } else {
        grapeImage.src = '/assets/pic/grapes.webp'; // Default generic image
    }
}

function createCrushingHTML() {
    const content = `     
            <div class="text-center">
                <h3 class="h5 mb-0">Grape Crushing</h3>
            </div>

            <div class="card-body">
                <div class="crushing-process">
                    ${createCrushingProcess()}
                </div>
            </div>
        
        <hr class="overlay-divider">

            ${createCrushingMethodSection()}
            
        <hr class="overlay-divider">    
        
            ${createProgressSection()}
        
            <div class="text-center">
                <h3 class="h5 mb-0">Select Grapes</h3>
            </div>

            <section id="select-grape-section">
                <div class="card-body">
                    ${createTable({
                        headers: ['Select', 'Container', 'Grapes in Storage', 'Amount', 'Quality'],
                        id: 'crushing-storage-table',
                        className: 'table-hover overlay-table'
                    })}
                </div>
            </section>
        
            <div class="text-center">
                <h3 class="h5 mb-0">Select Storage</h3>
            </div>
            
            <section id="must-section">
                <div class="card-body">
                    ${createTable({
                        headers: ['Select', 'Container', 'Must in Storage', 'Capacity', 'Available Space'],
                        id: 'crushing-must-storage-table',
                        className: 'table-hover overlay-table'
                    })}
                </div>
            </section>

            
        <!-- Add work calculation section -->
        <div class="crushing-work-section">
            ${createWorkCalculationTable(calculateCrushingWorkData(0))}
        </div>
    `;

    return createOverlayHTML({
        title: 'Grape Crushing',
        content,
        buttonText: 'Crush Selected Grapes',
        buttonClass: 'btn-primary crush-btn',
        buttonIdentifier: 'crush-btn',
        isModal: true
    });
}

// New helper function to keep the code organized
function createCrushingProcess() {
    return `
        <!-- Left: Grapes Input -->
        <div class="crushing-stage">
            <img src="/assets/pic/grapes.webp" class="crushing-input-image" alt="Input Grapes">
            <div class="crushing-data">
                <div class="crushing-data-item">
                    <span class="crushing-data-label">Amount:</span>
                    <span id="grape-amount">0 kg</span>
                </div>
                <div class="crushing-data-item">
                    <span class="crushing-data-label">Quality:</span>
                    <span id="grape-quality">0%</span>
                </div>
                <div class="crushing-data-item">
                    <span class="crushing-data-label">Field:</span>
                    <span id="grape-field">None</span>
                </div>
                <div class="crushing-data-item">
                    <span class="crushing-data-label">Grape:</span>
                    <span id="grape-info">None</span>
                </div>
            </div>
            <div class="crushing-arrow left-arrow"></div>
        </div>

        <!-- Center: Crushing Process -->
        <div class="crushing-stage center-stage">
            <img src="/assets/pic/crushing_dalle.webp" class="crushing-machine-image" alt="Crushing Machine">
            <button class="btn btn-light btn-sm crush-btn">Crush Selected Grapes</button>
        </div>

        <!-- Right: Must Output -->
        <div class="crushing-stage">
            <img src="/assets/pic/must.webp" class="crushing-output-image" alt="Output Must">
            <div class="crushing-data">
                <div class="crushing-data-item">
                    <span class="crushing-data-label">Expected:</span>
                    <span id="must-expected">0 L</span>
                </div>
                <div class="crushing-data-item">
                    <span class="crushing-data-label">Storage:</span>
                    <span id="must-storage">None</span>
                </div>
                <div class="crushing-data-item">
                    <span class="crushing-data-label">Available:</span>
                    <span id="must-available">0 L</span>
                </div>
            </div>
            <div class="crushing-arrow right-arrow"></div>
        </div>

    `;
}

function createProgressSection() {
    return `
        <div class="card-body">
            <div class="button-container">
                <div class="selected-wrapper">
                    <span>Selected Storage: </span>
                    <span id="selected-grapes">0 L</span>
                    <span> / </span>
                    <span id="selected-storage">0 L</span>
                </div>
                <div class="w-100">
                    <div class="progress">
                        <div id="selected-storage-progress" class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateStorageProgress() {
    const checkboxes = document.querySelectorAll('input[name="must-storage"]:checked');
    let totalStorage = 0;
    checkboxes.forEach(checkbox => {
        totalStorage += parseFloat(checkbox.dataset.available);
    });

    const selectedGrapes = parseFloat(document.querySelector('.grape-select:checked')?.dataset.amount || 0);
    const estimatedMust = calculateMustAmount(selectedGrapes, true);

    const storageDisplay = document.getElementById('selected-storage');
    const grapesDisplay = document.getElementById('selected-grapes');
    
    storageDisplay.textContent = `${formatNumber(totalStorage)} L`;
    grapesDisplay.textContent = `≈ ${formatNumber(estimatedMust)} L`;  

    const progressPercentage = Math.min((totalStorage / estimatedMust) * 100, 100);
    const storageProgress = document.getElementById('selected-storage-progress');
    storageProgress.style.width = `${progressPercentage}%`;
    storageProgress.setAttribute('aria-valuenow', progressPercentage);
}


// Update the setupCrushingEventListeners to only allow clicking on available methods
function setupCrushingEventListeners(overlay) {
    const crushBtn = overlay.querySelector('.crush-btn');
    const closeBtn = overlay.querySelector('.close-btn');
    const noCrushingCheckbox = overlay.querySelector('#no-crushing');
    const methodRadios = overlay.querySelectorAll('input[name="crushing-method"]');

    // Move validateCrushingSelection outside the function scope
    function validateCrushingSelection() {
        const hasMethodSelected = Array.from(methodRadios).some(radio => radio.checked);
        const isNoCrushing = noCrushingCheckbox.checked;
        crushBtn.disabled = !hasMethodSelected && !isNoCrushing;
    }

    // Handle crushing method selection
    methodRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                noCrushingCheckbox.checked = false;
                validateCrushingSelection();
                // Update work calculation when method changes
                const selectedGrape = overlay.querySelector('.grape-select:checked');
                if (selectedGrape) {
                    updateCrushingData(selectedGrape, null);
                }
            }
        });
    });

    noCrushingCheckbox.addEventListener('change', () => {
        if (noCrushingCheckbox.checked) {
            methodRadios.forEach(radio => radio.checked = false);
            // Deselect all method items and their radio buttons
            const methodItems = overlay.querySelectorAll('.method-item');
            methodItems.forEach(item => {
                item.classList.remove('selected');
                const radio = item.querySelector('input[type="radio"]');
                if (radio) radio.checked = false;
            });
        }
        validateCrushingSelection();
    });

    if (crushBtn) {
        crushBtn.disabled = true; // Initially disabled
        crushBtn.addEventListener('click', () => {
            if (handleCrushingStart(overlay)) {
                showWineryOverlay();
                hideOverlay(overlay);
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideOverlay(overlay);
        });
    }

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            hideOverlay(overlay);
        }
    });

    // Add method selection handlers
    const methodItems = overlay.querySelectorAll('.method-item:not(.disabled)');
    methodItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove selection from all items
            methodItems.forEach(i => i.classList.remove('selected'));
            // Select clicked item
            item.classList.add('selected');
            // Check the hidden radio
            const radio = item.querySelector('input[type="radio"]');
            radio.checked = true;
            // Uncheck the no-crushing checkbox
            overlay.querySelector('#no-crushing').checked = false;
            validateCrushingSelection();
        });
    });
}

function populateTables(overlayContainer) {
  const buildings = loadBuildings();
  const inventoryInstance = loadInventory();
  const selectedGrape = overlayContainer.querySelector('.grape-select:checked');

  populateMustStorageTable(overlayContainer, buildings, inventoryInstance.items, selectedGrape);
  populateGrapesTable(overlayContainer, buildings, inventoryInstance.items);
}

function populateMustStorageTable(overlayContainer, buildings, playerInventory, selectedGrape) {
  const mustStorageBody = overlayContainer.querySelector('#crushing-must-storage-table');
  mustStorageBody.innerHTML = '';

  buildings.forEach(building => {
    if (!building.slots) return;

    building.slots.forEach(slot => {
      slot.tools.forEach(tool => {
        if (tool.supportedResources?.includes('Must')) {
          const toolId = `${tool.name} #${tool.instanceNumber}`;
          const matchingInventoryItems = playerInventory.filter(item => item.storage === toolId);
          const currentAmount = matchingInventoryItems.reduce((sum, item) => sum + item.amount, 0);
          const availableSpace = tool.capacity - currentAmount;
          const firstItem = matchingInventoryItems[0];

          // Check if the storage already contains a different resource or vintage
          const isDifferentResourceOrVintage = selectedGrape && firstItem && (
            firstItem.resource.name !== selectedGrape.dataset.resource ||
            firstItem.vintage !== parseInt(selectedGrape.dataset.vintage)
          );

          if (availableSpace > 0 && !isDifferentResourceOrVintage) {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td><input type="checkbox" name="must-storage" value="${toolId}" 
                  data-capacity="${tool.capacity}" data-available="${availableSpace}"></td>
              <td>${toolId}</td>
              <td>${firstItem ? `<strong>${firstItem.fieldName}</strong>, ${firstItem.resource.name}, ${firstItem.vintage}` : 'Empty'}</td>
              <td>${formatNumber(tool.capacity)} l</td>
              <td>${formatNumber(availableSpace)} l</td>
            `;
            mustStorageBody.appendChild(row);

            row.querySelector('input[name="must-storage"]').addEventListener('change', function() {
              updateStorageProgress();
              updateCrushingData(document.querySelector('.grape-select:checked'), this);
            });
          }
        }
      });
    });
  });
}

function populateGrapesTable(overlayContainer, buildings, playerInventory) {
  const storageTableBody = overlayContainer.querySelector('#crushing-storage-table');
  buildings.forEach(building => {
    if (!building.slots) return;

    building.slots.forEach(slot => {
      slot.tools.forEach(tool => {
        if (tool.supportedResources?.includes('Grapes')) {
          const toolId = `${tool.name} #${tool.instanceNumber}`;
          const matchingInventoryItems = playerInventory.filter(item => 
            item.storage === toolId &&
            item.state === 'Grapes'
          );

          matchingInventoryItems.forEach(item => {
            const row = document.createElement('tr');
            const qualityDisplay = `<span class="${getColorClass(item.quality)}">(${(item.quality * 100).toFixed(0)}%)</span>`;
            const formattedAmount = item.amount >= 1000 ? 
              `${formatNumber(item.amount / 1000, 2)} t` : 
              `${formatNumber(item.amount)} kg`;

            row.innerHTML = `
              <td><input type="radio" name="grape-select" class="grape-select" data-storage="${item.storage}" 
                  data-resource="${item.resource.name}" data-vintage="${item.vintage}" 
                  data-quality="${item.quality}" data-field="${item.fieldName}"
                  data-amount="${item.amount}"
                  data-prestige="${item.fieldPrestige}"></td>
              <td>${item.storage}</td>
              <td><strong>${item.fieldName}</strong>, ${item.resource.name}, ${item.vintage}</td>
              <td>${formattedAmount}</td>
              <td>${qualityDisplay}</td>
            `;
            storageTableBody.appendChild(row);

            // Add event listener to update selected grapes
            row.querySelector('.grape-select').addEventListener('change', function() {
              const selectedGrapes = parseFloat(this.dataset.amount);
              const resourceName = this.dataset.resource;
              updateGrapeImage(resourceName);
              const grapesDisplay = document.getElementById('selected-grapes');
              grapesDisplay.textContent = selectedGrapes >= 1000 ? 
                formatNumber(selectedGrapes / 1000, 2) + ' t' : 
                formatNumber(selectedGrapes) + ' kg';
              updateStorageProgress();
              updateCrushingData(this, null);
            });
          });
        }
      });
    });
  });
}

function calculateMustAmount(grapeAmount, isEstimate = false) {
    if (isEstimate) {
        // For display purposes, return rounded estimate
        return Math.round((grapeAmount * 0.6) / 10) * 10;
    } else {
        // For actual conversion, add small random variation (±2%)
        const variation = 1 + (Math.random() * 0.04 - 0.02);
        return grapeAmount * 0.6 * variation;
    }
}

function updateCrushingData(selectedGrape, selectedStorage) {
    if (selectedGrape) {
        const amount = parseFloat(selectedGrape.dataset.amount);
        const quality = parseFloat(selectedGrape.dataset.quality);
        const fieldName = selectedGrape.dataset.field;
        const resourceName = selectedGrape.dataset.resource;
        const vintage = selectedGrape.dataset.vintage;
        
        document.getElementById('grape-amount').textContent = amount >= 1000 ? 
            `${formatNumber(amount / 1000, 2)} t` : 
            `${formatNumber(amount)} kg`;
        document.getElementById('grape-quality').innerHTML = 
            `<span class="${getColorClass(quality)}">${(quality * 100).toFixed(0)}%</span>`;
        document.getElementById('grape-field').textContent = fieldName;
        document.getElementById('grape-info').textContent = `${resourceName}, ${vintage}`;

        const grapeAmount = parseFloat(selectedGrape.dataset.amount);
        const estimatedMust = calculateMustAmount(grapeAmount, true); // Use rounded estimate
        document.getElementById('must-expected').textContent = 
            `≈ ${formatNumber(estimatedMust)} L`;  // Added ≈ symbol

        const selectedStorages = document.querySelectorAll('input[name="must-storage"]:checked');
        let totalStorage = 0;
        let availableSpace = 0;
        let storageName = 'None';

        if (selectedStorages.length > 0) {
            selectedStorages.forEach(storage => {
                totalStorage += parseFloat(storage.dataset.capacity);
                availableSpace += parseFloat(storage.dataset.available);
            });
            storageName = selectedStorages.length === 1 ? 
                selectedStorages[0].value : 
                `${selectedStorages.length} containers`;
        }

        document.getElementById('must-storage').textContent = storageName;
        document.getElementById('must-available').textContent = 
            `${formatNumber(availableSpace)} L`;

        // Update work calculation
        const workSection = document.querySelector('.crushing-work-section');
        if (workSection) {
            const selectedMethod = document.querySelector('input[name="crushing-method"]:checked')?.value;
            workSection.innerHTML = createWorkCalculationTable(calculateCrushingWorkData(amount, selectedMethod));
        }
    }
}

function validateCrushingInputs(overlayContainer) {
    // 1. Check crushing method selection
    const selectedMethod = overlayContainer.querySelector('input[name="crushing-method"]:checked')?.value;
    const skipCrushing = overlayContainer.querySelector('#no-crushing').checked;

    if (!skipCrushing && !selectedMethod) {
        addConsoleMessage("Please select a crushing method or check 'Skip crushing'");
        return { valid: false };
    }

    // 2. Check grape selection
    const selectedGrape = overlayContainer.querySelector('.grape-select:checked');
    if (!selectedGrape) {
        addConsoleMessage("Please select grapes to crush");
        return { valid: false };
    }

    // 3. Check for existing tasks
    const existingTasks = taskManager.getAllTasks().filter(task => 
        task.name === 'Crushing' && 
        task.target === selectedGrape.dataset.storage
    );

    if (existingTasks.length > 0) {
        addConsoleMessage("A crushing task is already in progress for these grapes");
        return { valid: false };
    }

    // 4. Check storage selection and compatibility
    const selectedStorages = overlayContainer.querySelectorAll('input[name="must-storage"]:checked');
    if (selectedStorages.length === 0) {
        addConsoleMessage("Please select at least one storage container for the must");
        return { valid: false };
    }

    const selectedStorageIds = Array.from(selectedStorages).map(storage => storage.value);
    const existingStorageTasks = taskManager.getAllTasks().filter(task => {
        if (task.name !== 'Crushing' || !task.params?.selectedStorages) return false;
        const taskStorages = Array.isArray(task.params.selectedStorages) ? 
            task.params.selectedStorages : 
            Array.from(task.params.selectedStorages);
        return taskStorages.some(storage => selectedStorageIds.includes(storage.value));
    });

    if (existingStorageTasks.length > 0) {
        addConsoleMessage("Selected must storage is already being used in another crushing task");
        return { valid: false };
    }

    // 5. Check storage compatibility
    let totalAvailableSpace = 0;
    let invalidStorages = [];

    selectedStorages.forEach(storage => {
        const availableSpace = parseFloat(storage.dataset.available);
        const storageId = storage.value;
        const matchingInventoryItems = inventoryInstance.items.filter(item => 
            item.storage === storageId && 
            item.state === 'Must'
        );

        if (matchingInventoryItems.length > 0) {
            const firstItem = matchingInventoryItems[0];
            if (firstItem.resource.name !== selectedGrape.dataset.resource || 
                firstItem.vintage !== parseInt(selectedGrape.dataset.vintage) ||
                firstItem.fieldName !== selectedGrape.dataset.field) {
                invalidStorages.push(storageId);
            } else {
                totalAvailableSpace += availableSpace;
            }
        } else {
            totalAvailableSpace += availableSpace;
        }
    });

    if (invalidStorages.length > 0) {
        invalidStorages.forEach(storageId => {
            addConsoleMessage(`Cannot use ${storageId} as it contains must from a different field, resource or vintage.`);
        });
        return { valid: false };
    }

    return {
        valid: true,
        data: {
            selectedGrape,
            selectedStorages,
            totalAvailableSpace,
            totalGrapes: parseFloat(selectedGrape.dataset.amount)
        }
    };
}

function showWarningModal(totalAvailableSpace, mustAmount, onConfirm) {
    const warningModal = document.createElement('div');
    warningModal.className = 'modal fade';
    warningModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content overlay-section">
                <div class="modal-header card-header">
                    <h3 class="modal-title">Warning: Limited Container Capacity</h3>
                    <button type="button" class="close" data-dismiss="modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Selected containers only have total capacity for ${formatNumber(totalAvailableSpace)} l. out of needed ${formatNumber(mustAmount)} l.</p>
                    <p>Do you want to crush what fits in the containers?</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="overlay-section-btn" data-dismiss="modal">Cancel</button>
                    <button type="button" class="overlay-section-btn" id="confirmCrush">Crush Available</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(warningModal);
    $(warningModal).modal('show');

    document.getElementById('confirmCrush').addEventListener('click', () => {
        onConfirm();
        $(warningModal).modal('hide');
        warningModal.remove();
    });

    warningModal.addEventListener('hidden.bs.modal', () => {
        warningModal.remove();
    });
}

function crushing(selectedGrape, selectedStorages, totalAvailableSpace, totalGrapes) {
    const workData = calculateCrushingWorkData(totalGrapes);
    const selectedMethod = document.querySelector('input[name="crushing-method"]:checked')?.value;
    const destemming = document.getElementById('destemming-checkbox')?.checked || false;
    
    const grapeResource = inventoryInstance.items.find(item => 
        item.storage === selectedGrape.dataset.storage &&
        item.state === 'Grapes' &&
        item.resource.name === selectedGrape.dataset.resource
    );
   
    // Get the task ID before creating the task
    const taskId = taskManager.taskIdCounter + 1;
    
    // Find and assign the selected crushing tool
    if (selectedMethod && selectedMethod !== 'Hand Crushing') {
        const buildings = loadBuildings();
        const tool = buildings.flatMap(b => 
            b.slots.flatMap(slot => 
                slot.tools.find(t => 
                    t.name === selectedMethod && 
                    t.isAvailable()
                )
            )
        ).find(t => t);

        if (tool) {
            tool.assignToTask(taskId);
            storeBuildings(buildings);
        }
    }

    taskManager.addProgressiveTask(
        'Crushing',
        'winery',
        workData.totalWork,
        (target, progress, params) => {
            if (!params.lastProgress) params.lastProgress = 0;
            const progressIncrement = progress - params.lastProgress;
            const grapesToProcess = Math.min(params.totalGrapes * progressIncrement, params.totalGrapes);
            const mustAmount = calculateMustAmount(grapesToProcess);
            params.lastProgress = progress;
            performCrushing(params.selectedStorages, mustAmount, grapesToProcess, params.destemming);
        },
        null,
        { 
            selectedGrape, 
            selectedStorages: Array.from(selectedStorages), 
            totalGrapes,
            selectedMethod,
            destemming,
            grapeRipeness: grapeResource.ripeness
        }
    );

    return true;
}

function handleCrushingStart(overlayContainer) {
    const validation = validateCrushingInputs(overlayContainer);
    if (!validation.valid) return false;

    const { selectedGrape, selectedStorages, totalAvailableSpace, totalGrapes } = validation.data;

    const mustAmount = calculateMustAmount(totalGrapes);

    if (mustAmount > totalAvailableSpace) {
        showWarningModal(totalAvailableSpace, mustAmount, () => {
            crushing(selectedGrape, selectedStorages, totalAvailableSpace, totalGrapes);
            showWineryOverlay();
            hideOverlay(overlayContainer);
        });
        return false;
    }

    return crushing(selectedGrape, selectedStorages, totalAvailableSpace, totalGrapes);
}

// Update performCrushing to be more explicit about the amounts
export function performCrushing(selectedStorages, mustAmount, grapeAmount, destemming) {

    // Now grapeAmount is explicitly passed and matches what we want to remove
    const grapeAmountToRemove = grapeAmount;
    if (grapeAmountToRemove <= 0) {
        return false;
    }

    const grapeResource = inventoryInstance.items.find(item => 
        item.state === 'Grapes' &&
        item.amount > 0
    );

    let remainingMust = mustAmount;
    let success = true;

    // Remove the amount of grapes corresponding to the processed amount
    const resourceName = grapeResource.resource.name;
    const vintage = grapeResource.vintage;
    const quality = grapeResource.quality;
    const fieldName = grapeResource.fieldName;
    const fieldPrestige = grapeResource.fieldPrestige;

    // Copy all grape characteristics
    const baseCharacteristics = {
        acidity: grapeResource.acidity,
        aroma: grapeResource.aroma,
        body: grapeResource.body,
        spice: grapeResource.spice,
        sweetness: grapeResource.sweetness,
        tannins: grapeResource.tannins,
        oxidation: grapeResource.oxidation || 0
    };

    // Calculate modified characteristics based on crushing process
    const characteristics = calculateCrushingCharacteristics(baseCharacteristics, {
        destemming  // Use the parameter value
    });

    let removed = inventoryInstance.removeResource(
        { name: resourceName },
        grapeAmountToRemove,
        'Grapes',
        vintage,
        grapeResource.storage
    );

    if (!removed) {
        // Try to remove the remaining grapes if the exact amount is not available
        const remainingGrapes = inventoryInstance.getResourceAmount(
            { name: resourceName },
            'Grapes',
            vintage,
            grapeResource.storage
        );

        if (remainingGrapes > 0) {
            removed = inventoryInstance.removeResource(
                { name: resourceName },
                remainingGrapes,
                'Grapes',
                vintage,
                grapeResource.storage
            );
            addConsoleMessage(`Crushed remaining ${formatNumber(remainingGrapes)} kg of ${resourceName} grapes from ${fieldName} into ${formatNumber(remainingGrapes * 0.6)} l of must`);
        } else {
            addConsoleMessage(`Failed to remove ${formatNumber(grapeAmountToRemove)} kg of grapes`);
            return false;
        }
    } else {
        addConsoleMessage(`Crushed ${formatNumber(grapeAmountToRemove)} kg of ${resourceName} grapes from ${fieldName} into ${formatNumber(grapeAmountToRemove * 0.6)} l of must`);
    }

    // Add special features based on destemming choice
    if (!destemming) {
        // Calculate chance of getting green flavors based on ripeness
        const ripeness = grapeResource.ripeness;
        const greenFlavorChance = (1 - ripeness) * 0.05;
        
        const roll = Math.random();
        
        if (roll < greenFlavorChance) {
            addConsoleMessage(`The must has developed green flavors due to stems being present during crushing.`);
            characteristics.specialFeatures = ['Green Flavors'];
        }
    }

    // Add even distribution of must among containers
    const storageArray = Array.from(selectedStorages);
    const mustPerStorage = remainingMust / storageArray.length;

    // Distribute must evenly among containers
    for (const storage of storageArray) {
        const mustStorage = storage.value;
        const amountToStore = Math.min(mustPerStorage, remainingMust);

        if (amountToStore > 0) {
            const newMust = inventoryInstance.addResource(
                { name: resourceName, naturalYield: 1 },
                amountToStore,
                'Must',
                vintage,
                quality,
                fieldName,
                fieldPrestige,
                mustStorage
            );

            // Apply modified characteristics and special features to the new must
            if (newMust) {
                Object.assign(newMust, characteristics);
                if (characteristics.specialFeatures) {
                    characteristics.specialFeatures.forEach(feature => {
                        newMust.addSpecialFeature(feature);
                    });
                }
            }

            remainingMust -= amountToStore;
        }

        if (remainingMust <= 0) break;
    }

    if (success) {
        inventoryInstance.save();
    }
    return success;
}

function createCrushingMethodSection() {
    const availableTools = getBuildingTools().filter(tool => 
        tool.validTasks.includes('crushing') && 
        !tool.assignable
    );

    const buildings = loadBuildings();
    const existingTools = buildings.flatMap(building => 
        building.slots.flatMap(slot => slot.tools)
    );

    const tasks = taskManager.getAllTasks();

    const methods = [
        {
            name: 'Hand Crushing',
            iconPath: '/assets/icon/buildings/hand crushing.png',
            stats: '2.5 tons/week',
            disabled: false
        },
        ...availableTools.map(tool => {
            // Check if we own the tool
            const ownedTools = existingTools.filter(t => t.name === tool.name);
            const hasTools = ownedTools.length > 0;

            // Check if all instances are in use
            const allToolsInUse = hasTools && ownedTools.every(t => t.assignedTaskId !== null);
            const inUseTaskNames = hasTools ? 
                ownedTools
                    .filter(t => t.assignedTaskId)
                    .map(t => tasks.find(task => task.id === t.assignedTaskId)?.name)
                    .filter(name => name)
                    .join(', ') 
                : '';

            const speedMultiplier = tool.speedBonus;
            const throughput = (2.5 * speedMultiplier).toFixed(1);

            return {
                name: tool.name,
                iconPath: `/assets/icon/buildings/${tool.name.toLowerCase()}.png`,
                stats: `${throughput} tons/week`,
                disabled: !hasTools || allToolsInUse,
                disabledReason: !hasTools 
                    ? 'You need to purchase this tool first'
                    : `Tool in use by: ${inUseTaskNames}`
            };
        })
    ];

    return `
        ${createMethodSelector({
            title: 'Select Crushing Method',
            methods,
            defaultMethod: 'Hand Crushing',
            showSkipOption: true,
            skipOptionText: 'Skip crushing (not recommended)',
            containerClass: 'crushing-methods-section',
            skipOptionId: 'no-crushing',
            methodRadioName: 'crushing-method'
        })}
        <div class="crushing-options mt-3">
            ${createCheckbox({
                id: 'destemming-checkbox',
                label: 'De-stemming (Removes stems before crushing, improves body and tannins but requires more work)',
                disabled: false,
                checked: false
            })}
        </div>
    `;
}

function calculateCrushingWorkData(grapeAmount, selectedMethod = null) {
    const tons = grapeAmount / 1000;
    let methodModifier = 0;
    let methodName = null;
    
    if (selectedMethod) {
        // Hand crushing is baseline (no modifier)
        if (selectedMethod === 'Hand Crushing') {
            methodModifier = 0;  // Changed from 1.0 to 0
            methodName = 'Hand Crushing';
        } else {
            const tool = getBuildingTools().find(t => t.name === selectedMethod);
            if (tool) {
                // Change from reducing work to directly using speedBonus
                methodModifier = -(1 - (1 / tool.speedBonus));  // This gives us the work reduction percentage
                methodName = tool.name;
            }
        }
    }

    let totalWork = calculateTotalWork(tons, {
        tasks: ['CRUSHING']
    });

    // Apply method modifier
    if (methodModifier !== 0) {
        totalWork *= (1 + methodModifier);  // This will reduce work for better tools
    }

    // Add work if destemming is checked
    const destemming = document.getElementById('destemming-checkbox')?.checked || false;
    if (destemming) {
        totalWork *= 1.2; // 20% more work for destemming
    }

    return {
        amount: grapeAmount,
        unit: grapeAmount >= 1000 ? 't' : 'kg',
        tasks: ['CRUSHING'],
        totalWork,
        location: 'winery',
        methodModifier,
        methodName,
        destemming
    };
}
