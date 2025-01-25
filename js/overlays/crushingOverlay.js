import { formatNumber, getColorClass } from '../utils.js';
import { addConsoleMessage } from '../console.js';
import { showWineryOverlay } from './mainpages/wineryoverlay.js';
import { inventoryInstance } from '../resource.js';
import taskManager, { TaskType } from '../taskManager.js';
import { showModalOverlay, hideOverlay } from './overlayUtils.js';

export function showCrushingOverlay() {
    const overlayContent = createCrushingHTML();
    const overlay = showModalOverlay('crushingOverlay', overlayContent);
    if (overlay) {
        setupCrushingEventListeners(overlay);
        populateTables(overlay);
    }
    return overlay;
}

function createCrushingHTML() {
    return `
        <div class="overlay-section-wrapper">
            <section id="vineyard-section" class="overlay-section card mb-4">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Grape Crushing</h3>
                    <button class="btn btn-light btn-sm close-btn">Close</button>
                </div>
                <div class="card-body"></div>
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Select Grapes to Crush</h3>
                </div>
                <div class="card-body">
                    ${createGrapesTable()}
                </div>
            </section>

            <section id="must-section" class="overlay-section card mb-4">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Select Must Storage Container</h3>
                </div>
                <div class="card-body">
                    ${createMustStorageTable()}
                </div>
            </section>

            <section id="crushing-progress" class="overlay-section card mb-4">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">Crushing Progress</h3>
                </div>
                <div class="card-body">
                    <div class="button-container d-flex flex-column align-items-center px-3">
                        <div class="w-100 mb-2">
                            <span>Selected Storage: </span>
                            <span id="selected-grapes">0 t</span>
                            <span> / </span>
                            <span id="selected-storage">0 l</span>
                        </div>
                        <div class="w-100">
                            <div class="progress" style="height: 20px; background-color: var(--color-background); border: 1px solid var(--color-accent); border-radius: var(--radius-md);">
                                <div id="selected-storage-progress" class="progress-bar" role="progressbar" style="width: 0%; background-color: var(--color-primary);" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                        </div>
                        <div class="d-flex justify-content-end mt-3 w-100">
                            <button class="btn btn-light btn-sm crush-btn">Crush Selected Grapes</button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `;
}

function setupCrushingEventListeners(overlay) {
    const crushBtn = overlay.querySelector('.crush-btn');
    const closeBtn = overlay.querySelector('.close-btn');

    if (crushBtn) {
        crushBtn.addEventListener('click', () => {
            if (crushing(overlay)) {
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
}

function createGrapesTable() {
    return `
        <div class="table-responsive">
            <table class="table table-hover overlay-table">
                <thead>
                    <tr>
                        <th>Select</th>
                        <th>Container</th>
                        <th>Wine in Storage</th>
                        <th>Amount</th>
                        <th>Quality</th>
                    </tr>
                </thead>
                <tbody id="crushing-storage-table">
                </tbody>
            </table>
        </div>
    `;
}

function createMustStorageTable() {
    return `
        <div class="table-responsive">
            <table class="table table-hover overlay-table">
                <thead>
                    <tr>
                        <th>Select</th>
                        <th>Container</th>
                        <th>Wine in Storage</th>
                        <th>Capacity</th>
                        <th>Available Space</th>
                    </tr>
                </thead>
                <tbody id="crushing-must-storage-table">
                </tbody>
            </table>
        </div>
    `;
}

function populateTables(overlayContainer) {
  const buildings = JSON.parse(localStorage.getItem('buildings')) || [];
  const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
  const selectedGrape = overlayContainer.querySelector('.grape-select:checked');

  populateMustStorageTable(overlayContainer, buildings, playerInventory, selectedGrape);
  populateGrapesTable(overlayContainer, buildings, playerInventory);
}

function populateMustStorageTable(overlayContainer, buildings, playerInventory, selectedGrape) {
  const mustStorageBody = overlayContainer.querySelector('#crushing-must-storage-table');
  mustStorageBody.innerHTML = '';
  
  buildings.forEach(building => {
    if (!building.tools) return;
    
    building.tools.forEach(tool => {
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

          // Add event listener to update storage progress
          row.querySelector('input[name="must-storage"]').addEventListener('change', function() {
            updateStorageProgress();
          });
        }
      }
    });
  });
}

function updateStorageProgress() {
  const checkboxes = document.querySelectorAll('input[name="must-storage"]:checked');
  let totalStorage = 0;
  checkboxes.forEach(checkbox => {
    totalStorage += parseFloat(checkbox.dataset.available);
  });

  const storageDisplay = document.getElementById('selected-storage');
  storageDisplay.textContent = `${formatNumber(totalStorage)} l`;

  const selectedGrapes = parseFloat(document.querySelector('.grape-select:checked')?.dataset.amount || 0);
  const storageProgress = document.getElementById('selected-storage-progress');
  const progressPercentage = Math.min((totalStorage / (selectedGrapes * 0.6)) * 100, 100);
  storageProgress.style.width = `${progressPercentage}%`;
  storageProgress.setAttribute('aria-valuenow', progressPercentage);
}

function populateGrapesTable(overlayContainer, buildings, playerInventory) {
  const storageTableBody = overlayContainer.querySelector('#crushing-storage-table');
  buildings.forEach(building => {
    if (!building.tools) return;
    
    building.tools.forEach(tool => {
      if (tool.supportedResources?.includes('Grapes')) {
        const matchingInventoryItems = playerInventory.filter(item => 
          item.storage === `${tool.name} #${tool.instanceNumber}` &&
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
            const grapesDisplay = document.getElementById('selected-grapes');
            grapesDisplay.textContent = selectedGrapes >= 1000 ? 
              formatNumber(selectedGrapes / 1000, 2) + ' t' : 
              formatNumber(selectedGrapes) + ' kg';
            updateStorageProgress();
          });
        });
      }
    });
  });
}


function crushing(overlayContainer) {
    const selectedGrape = overlayContainer.querySelector('.grape-select:checked');
    if (!selectedGrape) {
        addConsoleMessage("Please select grapes to crush");
        return false;
    }

    const selectedStorages = overlayContainer.querySelectorAll('input[name="must-storage"]:checked');
    const totalGrapes = parseFloat(selectedGrape.dataset.amount);

    // Check for existing crushing tasks with the same grape storage
    const existingTasks = taskManager.getAllTasks().filter(task => 
        task.name === 'Crushing' && 
        task.target?.dataset?.storage === selectedGrape.dataset.storage
    );

    if (existingTasks.length > 0) {
        addConsoleMessage("A crushing task is already in progress for these grapes");
        return false;
    }

    // Check if any selected must storage is already being used in another crushing task
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
        return false;
    }

    // Check if there's any work progress
    const workProgress = taskManager.getTaskProgress('Crushing');
    if (workProgress <= 0) {
        addConsoleMessage("No work has been done on crushing yet");
        return false;
    }

    if (selectedStorages.length === 0) {
        addConsoleMessage("Please select at least one storage container for the must");
        return false;
    }

    let totalAvailableSpace = 0;
    let invalidStorage = false;

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
                invalidStorage = true;
                addConsoleMessage(`Cannot use ${storageId} as it contains must from a different field, resource or vintage.`);
            } else {
                totalAvailableSpace += availableSpace;
            }
        } else {
            totalAvailableSpace += availableSpace;
        }
    });

    if (invalidStorage) {
        return false;
    }

    const mustAmount = totalGrapes * 0.6;  // 60% of grapes become must

    if (mustAmount > totalAvailableSpace) {
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
            const success = addCrushingTask(selectedGrape, selectedStorages, totalAvailableSpace, totalGrapes);
            if (success) {
                $(warningModal).modal('hide');
                warningModal.remove();
                showWineryOverlay();
                hideOverlay(overlayContainer);
            }
        });

        warningModal.addEventListener('hidden.bs.modal', () => {
            warningModal.remove();
        });

        return false;
    }

    // Initiate the harvest task using the taskManager system
    const taskName = `Crushing`;
    const totalWork = mustAmount;

    // Store grape data in params
    const grapeData = {
        resource: selectedGrape.dataset.resource,
        vintage: parseInt(selectedGrape.dataset.vintage),
        quality: selectedGrape.dataset.quality,
        fieldName: selectedGrape.dataset.field,
        fieldPrestige: parseFloat(selectedGrape.dataset.prestige),
        storage: selectedGrape.dataset.storage
    };

    taskManager.addProgressiveTask(
        taskName,
        TaskType.winery,
        totalWork,
        (target, progress, params) => {
            const processedAmount = mustAmount * (progress - (params.lastProgress || 0));
            params.lastProgress = progress;
            performCrushing(params.grapeData, params.selectedStorages, processedAmount, params.totalGrapes);
        },
        "",
        { 
            selectedStorages: Array.from(selectedStorages), 
            totalGrapes, 
            lastProgress: 0,
            grapeData
        }
    );

    return true;
}

export function performCrushing(selectedGrape, selectedStorages, mustAmount, totalGrapes) {
    const grapeAmountToRemove = Math.min(mustAmount / 0.6, totalGrapes);
    if (grapeAmountToRemove <= 0) {
        return false; // Skip if no grapes to crush
    }
    
    let remainingMust = mustAmount;
    let success = true;

    // Remove the amount of grapes corresponding to the processed amount
    const resourceName = selectedGrape.resource;
    const vintage = selectedGrape.vintage;
    const quality = selectedGrape.quality;
    const fieldName = selectedGrape.fieldName;
    const fieldPrestige = selectedGrape.fieldPrestige;

    let removed = inventoryInstance.removeResource(
        { name: resourceName },
        grapeAmountToRemove,
        'Grapes',
        vintage,
        selectedGrape.storage
    );

    if (!removed) {
        // Try to remove the remaining grapes if the exact amount is not available
        const remainingGrapes = inventoryInstance.getResourceAmount(
            { name: resourceName },
            'Grapes',
            vintage,
            selectedGrape.dataset.storage
        );

        if (remainingGrapes > 0) {
            removed = inventoryInstance.removeResource(
                { name: resourceName },
                remainingGrapes,
                'Grapes',
                vintage,
                selectedGrape.dataset.storage
            );
            addConsoleMessage(`Crushed remaining ${formatNumber(remainingGrapes)} kg of ${resourceName} grapes from ${fieldName} into ${formatNumber(remainingGrapes * 0.6)} l of must in ${selectedGrape.dataset.storage}`);
        } else {
            addConsoleMessage(`Failed to remove ${formatNumber(grapeAmountToRemove)} kg of grapes from ${selectedGrape.dataset.storage}`);
            return false;
        }
    } else {
        addConsoleMessage(`Crushed ${formatNumber(grapeAmountToRemove)} kg of ${resourceName} grapes from ${fieldName} into ${formatNumber(grapeAmountToRemove * 0.6)} l of must in ${selectedGrape.dataset.storage}`);
    }

    // Calculate even distribution of must among containers
    const storageArray = Array.from(selectedStorages);
    const totalAvailableSpace = storageArray.reduce((sum, storage) => 
        sum + parseFloat(storage.dataset.available), 0);
    const mustPerStorage = Math.min(remainingMust / storageArray.length, 
        totalAvailableSpace / storageArray.length);

    // Distribute must evenly among containers
    for (const storage of storageArray) {
        const mustStorage = storage.value;
        const availableSpace = parseFloat(storage.dataset.available);
        const amountToStore = Math.min(mustPerStorage, availableSpace, remainingMust);

        if (amountToStore > 0) {
            inventoryInstance.addResource(
                { name: resourceName, naturalYield: 1 },
                amountToStore,
                'Must',
                vintage,
                quality,
                fieldName,
                fieldPrestige,
                mustStorage
            );

            remainingMust -= amountToStore;
        }
        
        if (remainingMust <= 0) break;
    }

    if (success) {
        inventoryInstance.save();
    }
    return success;
}

//removeOverlay function is replaced by hideOverlay from overlayUtils.js