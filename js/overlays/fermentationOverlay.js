import { formatNumber, getColorClass } from '../utils.js';
import { addConsoleMessage } from '../console.js';
import { showWineryOverlay } from './mainpages/wineryoverlay.js';
import { showModalOverlay, hideOverlay } from './overlayUtils.js';
import { createOverlayHTML, createTable, createMethodSelector, createTextCenter } from '../components/createOverlayHTML.js';
import { calculateTotalWork } from '../utils/workCalculator.js';
import { createWorkCalculationTable } from '../components/workCalculationTable.js';
import { loadBuildings, loadInventory } from '../database/adminFunctions.js';
import { fermentation } from '../wineprocessing.js';


export function showFermentationOverlay() {
    const overlayContent = createFermentationHTML();
    const overlay = showModalOverlay('fermentationOverlay', overlayContent);
    if (overlay) {
        setupFermentationEventListeners(overlay);
        populateTables(overlay);
    }
    return overlay;
}

function createFermentationHTML() {
    const content = `     
        ${createTextCenter({
            text: 'Must Fermentation',
            isHeadline: true,
            headlineLevel: 5
        })}

        <div class="card-body">
            <div class="fermentation-process">
                ${createFermentationProcess()}
            </div>
        </div>
    
        <hr class="overlay-divider">
        
        ${createFermentationMethodSection()}
        
        <hr class="overlay-divider">    
        
        ${createTextCenter({
            text: 'Select Must for Fermentation',
            isHeadline: true,
            headlineLevel: 5
        })}

        <section id="must-selection">
            <div class="card-body">
                ${createTable({
                    headers: ['Select', 'Container', 'Must in Storage', 'Amount', 'Quality'],
                    id: 'fermentation-must-table',
                    className: 'table-hover overlay-table'
                })}
            </div>
        </section>

        <div class="fermentation-work-section">
            ${createWorkCalculationTable(calculateFermentationWorkData(0))}
        </div>
    `;

    return createOverlayHTML({
        title: 'Must Fermentation',
        content,
        buttonText: 'Start Fermentation',
        buttonClass: 'btn-primary ferment-btn',
        buttonIdentifier: 'ferment-btn',
        isModal: true
    });
}

function createFermentationProcess() {
    return `
        <!-- Left: Must Input -->
        <div class="fermentation-stage">
            <img src="/assets/pic/must.webp" class="fermentation-input-image" alt="Input Must">
            <div class="fermentation-data">
                <div class="fermentation-data-item">
                    <span class="fermentation-data-label">Amount:</span>
                    <span id="must-amount">0 L</span>
                </div>
                <div class="fermentation-data-item">
                    <span class="fermentation-data-label">Quality:</span>
                    <span id="must-quality">0%</span>
                </div>
                <div class="fermentation-data-item">
                    <span class="fermentation-data-label">Field:</span>
                    <span id="must-field">None</span>
                </div>
                <div class="fermentation-data-item">
                    <span class="fermentation-data-label">Grape:</span>
                    <span id="must-info">None</span>
                </div>
            </div>
            <div class="fermentation-arrow left-arrow"></div>
        </div>

        <!-- Center: Fermentation Process -->
        <div class="fermentation-stage center-stage">
            <img src="/assets/pic/fermentation_dalle.webp" class="fermentation-machine-image" alt="Fermentation Process">
            <button class="btn btn-light btn-sm ferment-btn">Start Fermentation</button>
        </div>

        <!-- Right: Wine Output -->
        <div class="fermentation-stage">
            <img src="/assets/pic/wine.webp" class="fermentation-output-image" alt="Output Wine">
            <div class="fermentation-data">
                <div class="fermentation-data-item">
                    <span class="fermentation-data-label">Expected:</span>
                    <span id="wine-expected">0 bottles</span>
                </div>
            </div>
            <div class="fermentation-arrow right-arrow"></div>
        </div>
    `;
}

function createFermentationMethodSection() {
    // Dummy methods for now
    const methods = [
        {
            name: 'Basic Fermentation',
            iconPath: '/assets/icon/buildings/fermentation.png',
            stats: '1000L/week',
            disabled: false
        },
        {
            name: 'Temperature Controlled',
            iconPath: '/assets/icon/buildings/temperature_control.png',
            stats: '2000L/week',
            disabled: true,
            disabledReason: 'Need to purchase equipment'
        }
    ];

    return createMethodSelector({
        title: 'Select Fermentation Method',
        methods,
        defaultMethod: 'Basic Fermentation',
        showSkipOption: false,
        containerClass: 'fermentation-methods-section',
        methodRadioName: 'fermentation-method'
    });
}

function setupFermentationEventListeners(overlay) {
    const fermentBtns = overlay.querySelectorAll('.ferment-btn');
    const closeBtn = overlay.querySelector('.close-btn');
    const methodRadios = overlay.querySelectorAll('input[name="fermentation-method"]');

    // Simplified validation - just check for must selection
    function validateFermentationSelection() {
        const hasMustSelected = overlay.querySelector('.must-select:checked') !== null;
        fermentBtns.forEach(btn => btn.disabled = !hasMustSelected);
    }

    // Add validation check to must selection events
    overlay.addEventListener('change', (event) => {
        if (event.target.classList.contains('must-select')) {
            validateFermentationSelection();
            updateFermentationData(event.target);
        }
    });

    // Handle method selection
    methodRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const selectedMust = overlay.querySelector('.must-select:checked');
            if (selectedMust) {
                updateFermentationData(selectedMust);
            }
        });
    });

    // Setup ferment buttons
    fermentBtns.forEach(btn => {
        btn.disabled = true; // Initially disabled
        btn.addEventListener('click', () => {
            if (handleFermentationStart(overlay)) {
                showWineryOverlay();
                hideOverlay(overlay);
            }
        });
    });

    // Setup close button
    closeBtn?.addEventListener('click', () => hideOverlay(overlay));
}

function updateFermentationData(selectedMust) {
    if (selectedMust) {
        const amount = parseFloat(selectedMust.dataset.amount);
        const quality = parseFloat(selectedMust.dataset.quality);
        const fieldName = selectedMust.dataset.field;
        const resourceName = selectedMust.dataset.resource;
        const vintage = selectedMust.dataset.vintage;
        
        // Update display fields
        document.getElementById('must-amount').textContent = `${formatNumber(amount)} L`;
        document.getElementById('must-quality').innerHTML = 
            `<span class="${getColorClass(quality)}">${(quality * 100).toFixed(0)}%</span>`;
        document.getElementById('must-field').textContent = fieldName;
        document.getElementById('must-info').textContent = `${resourceName}, ${vintage}`;

        // Calculate expected wine bottles (0.75L per bottle)
        const expectedWine = Math.floor(amount * 0.9 / 0.75);
        document.getElementById('wine-expected').textContent = `${formatNumber(expectedWine)} bottles`;

        // Update work calculation
        const workSection = document.querySelector('.fermentation-work-section');
        if (workSection) {
            const selectedMethod = document.querySelector('input[name="fermentation-method"]:checked')?.value;
            workSection.innerHTML = createWorkCalculationTable(
                calculateFermentationWorkData(amount, selectedMethod)
            );
        }
    }
}

export function calculateFermentationWorkData(mustAmount, selectedMethod = null) {
    // Get base work using FERMENTATION task from constants
    const workFactors = {
        tasks: ['FERMENTATION'],
        workModifiers: []
    };

    // Add method modifier if any
    if (selectedMethod && selectedMethod !== 'Basic Fermentation') {
        const methodModifiers = {
            'Temperature Controlled': -0.3 // 30% faster
            // Add more methods here
        };
        if (methodModifiers[selectedMethod]) {
            workFactors.workModifiers.push(methodModifiers[selectedMethod]);
        }
    }

    const totalWork = calculateTotalWork(mustAmount / 1000, workFactors);

    return {
        amount: mustAmount,
        unit: 'L',
        tasks: ['FERMENTATION'],
        totalWork,
        location: 'winery',
        methodName: selectedMethod || 'Basic Fermentation'
    };
}

function populateTables(overlayContainer) {
    const buildings = loadBuildings();
    const inventory = loadInventory();

    const mustTableBody = overlayContainer.querySelector('#fermentation-must-table');
    mustTableBody.innerHTML = '';

    buildings.forEach(building => {
        building.slots?.forEach(slot => {
            slot.tools?.forEach(tool => {
                if (tool.supportedResources?.includes('Must')) {
                    const toolId = `${tool.name} #${tool.instanceNumber}`;
                    const matchingInventoryItems = inventory.items.filter(item => 
                        item.storage === toolId && 
                        item.state === 'Must'
                    );

                    matchingInventoryItems.forEach(item => {
                        const row = document.createElement('tr');
                        const qualityDisplay = `<span class="${getColorClass(item.quality)}">(${(item.quality * 100).toFixed(0)}%)</span>`;
                        
                        row.innerHTML = `
                            <td><input type="radio" name="must-select" class="must-select" 
                                data-storage="${item.storage}" 
                                data-resource="${item.resource.name}" 
                                data-vintage="${item.vintage}"
                                data-quality="${item.quality}"
                                data-field="${item.fieldName}"
                                data-amount="${item.amount}"></td>
                            <td>${item.storage}</td>
                            <td><strong>${item.fieldName}</strong>, ${item.resource.name}, ${item.vintage}</td>
                            <td>${formatNumber(item.amount)} L</td>
                            <td>${qualityDisplay}</td>
                        `;
                        mustTableBody.appendChild(row);

                        // Add change listener for work calculation updates
                        row.querySelector('.must-select').addEventListener('change', function() {
                            updateFermentationData(this);
                        });
                    });
                }
            });
        });
    });
}

function handleFermentationStart(overlayContainer) {
    const selectedMust = overlayContainer.querySelector('.must-select:checked');
    if (!selectedMust) {
        addConsoleMessage("Please select must to ferment");
        return false;
    }

    const selectedMethod = overlayContainer.querySelector('input[name="fermentation-method"]:checked')?.value;
    const mustAmount = parseFloat(selectedMust.dataset.amount);
    const workData = calculateFermentationWorkData(mustAmount, selectedMethod);

    // Call the main fermentation function (like crushing)
    return fermentation(
        selectedMust.dataset.resource,
        selectedMust.dataset.storage,
        mustAmount,
        {
            vintage: parseInt(selectedMust.dataset.vintage),
            quality: parseFloat(selectedMust.dataset.quality),
            fieldName: selectedMust.dataset.field,
            selectedMethod
        }
    );
}

