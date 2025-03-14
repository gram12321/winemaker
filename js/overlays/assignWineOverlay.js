import { formatNumber, formatQualityDisplay } from '../utils.js';
import { inventoryInstance } from '../resource.js';
import { showModalOverlay, hideOverlay } from './overlayUtils.js';
import { updateAllDisplays } from '../displayManager.js';
import { fulfillContractWithSelectedWines, wineMatchesAllRequirements } from '../contracts.js';
import { calculateWinePrice } from '../sales.js';

/**
 * Show the assign wine overlay for contract fulfillment
 * @param {Object} contract The contract to fulfill
 * @param {Number} contractIndex The index of the contract in pending contracts
 */
export function showAssignWineOverlay(contract, contractIndex) {
    // Get all bottled wines from inventory that meet requirements
    const bottledWines = inventoryInstance.items.filter(item => 
        item.state === 'Bottles' && 
        wineMatchesAllRequirements(item, contract)
    );

    const overlayContent = generateAssignWineHTML(contract, bottledWines);
    const overlay = showModalOverlay('assignWineOverlay', overlayContent);
    
    if (overlay) {
        setupAssignWineEventListeners(overlay, contract, contractIndex, bottledWines);
    }
    
    return overlay;
}

/**
 * Generate HTML for the assign wine overlay
 * @param {Object} contract The contract to fulfill
 * @param {Array} eligibleWines Array of wines that meet contract requirements
 * @returns {string} HTML content for the overlay
 */
function generateAssignWineHTML(contract, eligibleWines) {
    const requiredAmount = contract.amount;
    
    // Get all bottled wines
    const allBottledWines = inventoryInstance.items.filter(item => item.state === 'Bottles');
    
    const wineListHTML = allBottledWines.map(wine => {
        const isEligible = wineMatchesAllRequirements(wine, contract);
        const basePrice = calculateWinePrice(wine.quality, wine, true);
        const priceDiff = ((contract.contractPrice / wine.customPrice - 1) * 100).toFixed(0);
        const priceClass = contract.contractPrice >= wine.customPrice ? 'text-success' : 'text-danger';
        const priceDisplay = priceDiff > 0 ? `+${priceDiff}%` : `${priceDiff}%`;

        // Generate simplified requirements validation display
        const requirementsValidation = contract.requirements.map(req => {
            const meets = req.validate(wine);
            // Simplified display text based on requirement type
            let displayText = '';
            switch(req.type) {
                case 'quality':
                    displayText = `Quality ${(req.value * 100).toFixed(0)}%`;
                    break;
                case 'vintage':
                    const gameYear = localStorage.getItem('year') ? parseInt(localStorage.getItem('year')) : 2023;
                    const reqYear = gameYear - req.value;
                    displayText = `Vintage ${reqYear}`;
                    break;
                case 'landvalue':
                    displayText = `Land €${formatNumber(req.value)}`;
                    break;
                case 'balance':
                    displayText = `Balance ${(req.value * 100).toFixed(0)}%`;
                    break;
                default:
                    return '';
            }
            return `<div class="${meets ? 'text-success' : 'text-danger'}">
                ${meets ? displayText : `<s>${displayText}</s>`}
            </div>`;
        }).join('');
        
        return `
            <tr class="${!isEligible ? 'text-muted' : ''}">
                <td>${wine.resource.name}, ${wine.vintage}, ${wine.fieldName || 'Unknown'}</td>
                <td>${formatQualityDisplay(wine.quality)}</td>
                <td>${formatNumber(wine.amount)} bottles</td>
                <td>${requirementsValidation}</td>
                <td>€${wine.customPrice ? wine.customPrice.toFixed(0) : '0.00'}</td>
                <td class="${isEligible ? priceClass : ''}">
                    €${contract.contractPrice.toFixed(0)} 
                    ${isEligible ? `(${priceDisplay})` : ''}
                </td>
                <td>
                    <div class="input-group input-group-sm">
                        <input type="range" class="form-range wine-quantity" 
                               min="0" max="${Math.min(wine.amount, requiredAmount)}" value="0" step="1"
                               data-original-max="${Math.min(wine.amount, requiredAmount)}"
                               data-wine-id="${wine.id || wine.resource.name + '-' + wine.vintage}"
                               data-wine-name="${wine.resource.name}"
                               data-wine-vintage="${wine.vintage}"
                               data-wine-quality="${wine.quality}"
                               data-wine-field="${wine.fieldName || ''}"
                               data-wine-storage="${wine.storage || ''}"
                               ${!isEligible ? 'disabled' : ''}>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Create requirements HTML for display
    let requirementsHTML = '<ul>';
    
    if (!contract.requirements || contract.requirements.length === 0) {
        requirementsHTML += '<li><em>No specific requirements</em></li>';
    } else {
        contract.requirements.forEach(req => {
            requirementsHTML += `<li>${req.getDescription()}</li>`;
        });
    }
    
    requirementsHTML += '</ul>';

    return `
        <div class="overlay-section-wrapper">
            <section class="overlay-section card">
                <div class="card-header text-white d-flex justify-content-between align-items-center">
                    <h3 class="mb-0">Fulfill Contract</h3>
                    <button class="btn btn-light btn-sm close-btn">Close</button>
                </div>
                <div class="card-body">
                    <div class="contract-details mb-4">
                        <h4>Contract Details</h4>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Importer:</strong> ${contract.importerType} (${contract.importerCountry})</p>
                                <p><strong>Requirements:</strong></p>
                                ${requirementsHTML}
                            </div>
                            <div class="col-md-6">
                                <p><strong>Amount:</strong> ${contract.amount} bottles</p>
                                <p><strong>Price:</strong> €${formatNumber(contract.contractPrice, 0)}/bottle (Total: €${formatNumber(contract.totalValue, 0)})</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="overlay-divider"></div>
                    
                    <div class="wine-selection">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h4>Select Wines</h4>
                            <div class="selected-amount">
                                Selected: <span id="selected-bottles">0</span>/${requiredAmount} bottles
                            </div>
                        </div>
                        
                        <div class="table-responsive">
                            <table class="table overlay-table">
                                <thead>
                                    <tr>
                                        <th>Wine</th>
                                        <th>Quality</th>
                                        <th>Available</th>
                                        <th>Demands</th>
                                        <th>Your Price</th>
                                        <th>Contract Price</th>
                                        <th>Select Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${wineListHTML}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-success fulfill-contract-btn" disabled>
                        Fulfill Contract
                    </button>
                </div>
            </section>
        </div>
    `;
}

/**
 * Setup event listeners for the assign wine overlay
 * @param {HTMLElement} overlay The overlay element
 * @param {Object} contract The contract to fulfill
 * @param {Number} contractIndex The index of the contract in pending contracts
 * @param {Array} eligibleWines Array of eligible wines
 */
function setupAssignWineEventListeners(overlay, contract, contractIndex, eligibleWines) {
    if (!overlay) return;
    
    const closeBtn = overlay.querySelector('.close-btn');
    const fulfillBtn = overlay.querySelector('.fulfill-contract-btn');
    const quantityInputs = overlay.querySelectorAll('.wine-quantity');
    
    // Close button event listener
    if (closeBtn) {
        closeBtn.addEventListener('click', () => hideOverlay(overlay));
    }
    
    // Wine quantity input event listeners
    if (quantityInputs) {
        quantityInputs.forEach(input => {
            input.addEventListener('input', () => {
                updateSelectedAmount(overlay, contract, quantityInputs);
                // Update max values for other inputs
                updateRangeMaxValues(quantityInputs, contract.amount);
            });
        });
    }
    
    // Fulfill contract button event listener
    if (fulfillBtn) {
        fulfillBtn.addEventListener('click', () => {
            // Get selected wines and quantities
            const selectedWines = [];
            
            quantityInputs.forEach(input => {
                const quantity = parseInt(input.value) || 0;
                if (quantity > 0) {
                    selectedWines.push({
                        name: input.dataset.wineName,
                        vintage: parseInt(input.dataset.wineVintage),
                        quality: parseFloat(input.dataset.wineQuality),
                        fieldName: input.dataset.wineField,
                        storage: input.dataset.wineStorage,
                        amount: quantity
                    });
                }
            });
            
            // Validate selected wines
            const validation = validateSelectedWines(selectedWines, contract);
            if (!validation.valid) {
                alert(validation.message);
                return;
            }
            
            // Call contract fulfillment function
            if (fulfillContractWithSelectedWines(contractIndex, selectedWines)) {
                hideOverlay(overlay);
                updateAllDisplays();
            }
        });
    }
    
    // Initial update of selected amount
    updateSelectedAmount(overlay, contract, quantityInputs);
}

/**
 * Update the selected amount display and enable/disable the fulfill button
 * @param {HTMLElement} overlay The overlay element
 * @param {Object} contract The contract object
 * @param {NodeList} quantityInputs The quantity input elements
 */
function updateSelectedAmount(overlay, contract, quantityInputs) {
    let totalSelected = 0;
    
    quantityInputs.forEach(input => {
        totalSelected += parseInt(input.value) || 0;
    });
    
    // Update the selected bottles counter
    const selectedCountEl = overlay.querySelector('#selected-bottles');
    if (selectedCountEl) {
        selectedCountEl.textContent = totalSelected;
    }
    
    // Enable/disable the fulfill button
    const fulfillBtn = overlay.querySelector('.fulfill-contract-btn');
    if (fulfillBtn) {
        fulfillBtn.disabled = totalSelected !== contract.amount;
    }
}

// Add this new helper function
function updateRangeMaxValues(quantityInputs, requiredAmount) {
    // Calculate total selected
    let totalSelected = 0;
    quantityInputs.forEach(input => {
        totalSelected += parseInt(input.value) || 0;
    });

    // For each input, set max to either its original max or remaining needed bottles
    quantityInputs.forEach(input => {
        const currentValue = parseInt(input.value) || 0;
        const originalMax = parseInt(input.dataset.originalMax || input.max);
        if (!input.dataset.originalMax) {
            input.dataset.originalMax = input.max; // Store original max first time
        }
        
        // Calculate remaining needed excluding current input's value
        const remainingNeeded = requiredAmount - (totalSelected - currentValue);
        
        // Set max to minimum between original max and remaining needed
        input.max = Math.min(originalMax, remainingNeeded);
    });
}

/**
 * Validate selected wines against contract requirements
 * @param {Array} selectedWines Array of selected wines
 * @param {Object} contract The contract object
 * @returns {Object} Validation result
 */
function validateSelectedWines(selectedWines, contract) {
    // Total amount check
    const totalSelected = selectedWines.reduce((total, wine) => total + wine.amount, 0);
    if (totalSelected !== contract.amount) {
        return {
            valid: false,
            message: `Selected amount (${totalSelected}) doesn't match contract requirement (${contract.amount} bottles).`
        };
    }
    
    // Check each requirement for each wine
    if (contract.requirements && contract.requirements.length > 0) {
        for (const wine of selectedWines) {
            // Find requirements this wine doesn't meet
            const failedRequirements = contract.requirements.filter(req => !req.validate(wine));
            
            if (failedRequirements.length > 0) {
                // Get descriptions of failed requirements for the message
                const requirementDescriptions = failedRequirements.map(req => req.getDescription()).join(', ');
                return {
                    valid: false,
                    message: `Some selected wines don't meet the requirements: ${requirementDescriptions}`
                };
            }
        }
    }
    
    return { valid: true };
}
