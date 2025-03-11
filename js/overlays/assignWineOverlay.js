import { formatNumber, formatQualityDisplay } from '../utils.js';
import { inventoryInstance } from '../resource.js';
import { showModalOverlay, hideOverlay } from './overlayUtils.js';
import { updateAllDisplays } from '../displayManager.js';
import { fulfillContractWithSelectedWines } from '../contracts.js';
import { calculateWinePrice } from '../sales.js';

/**
 * Show the assign wine overlay for contract fulfillment
 * @param {Object} contract The contract to fulfill
 * @param {Number} contractIndex The index of the contract in pending contracts
 */
export function showAssignWineOverlay(contract, contractIndex) {
    // Get all bottled wines from inventory
    const bottledWines = inventoryInstance.items.filter(item => 
        item.state === 'Bottles' && 
        // Check if wine meets minimum quality requirements
        matchesContractRequirements(item, contract)
    );

    const overlayContent = generateAssignWineHTML(contract, bottledWines);
    const overlay = showModalOverlay('assignWineOverlay', overlayContent);
    
    if (overlay) {
        setupAssignWineEventListeners(overlay, contract, contractIndex, bottledWines);
    }
    
    return overlay;
}

/**
 * Check if a wine matches the contract requirements
 * @param {Object} wine The wine to check
 * @param {Object} contract The contract with requirements
 * @returns {boolean} True if wine meets contract requirements
 */
function matchesContractRequirements(wine, contract) {
    // For now, implement simple quality check
    return wine.quality >= (contract.minQuality || 0.1);
}

/**
 * Generate HTML for the assign wine overlay
 * @param {Object} contract The contract to fulfill
 * @param {Array} eligibleWines Array of wines that meet contract requirements
 * @returns {string} HTML content for the overlay
 */
function generateAssignWineHTML(contract, eligibleWines) {
    // Calculate how many more bottles are needed
    const requiredAmount = contract.amount;
    
    const wineListHTML = eligibleWines.length > 0 ? 
        eligibleWines.map(wine => {
            const basePrice = calculateWinePrice(wine.quality, wine, true);
            const priceRatio = (contract.contractPrice / basePrice).toFixed(2);
            const priceClass = contract.contractPrice >= basePrice ? 'text-success' : 'text-danger';
            
            return `
                <tr>
                    <td>${wine.resource.name}</td>
                    <td>${wine.vintage}</td>
                    <td>${wine.fieldName || 'Unknown'}</td>
                    <td>${formatQualityDisplay(wine.quality)}</td>
                    <td>${formatNumber(wine.amount)} bottles</td>
                    <td>€${wine.customPrice ? wine.customPrice.toFixed(2) : '0.00'}</td>
                    <td class="${priceClass}">
                        €${contract.contractPrice.toFixed(2)} 
                        (${priceRatio}x)
                    </td>
                    <td>
                        <div class="input-group input-group-sm">
                            <input type="number" class="form-control wine-quantity" 
                                   min="0" max="${wine.amount}" value="0"
                                   data-wine-id="${wine.id || wine.resource.name + '-' + wine.vintage}"
                                   data-wine-name="${wine.resource.name}"
                                   data-wine-vintage="${wine.vintage}"
                                   data-wine-quality="${wine.quality}"
                                   data-wine-field="${wine.fieldName || ''}"
                                   data-wine-storage="${wine.storage || ''}">
                        </div>
                    </td>
                </tr>
            `;
        }).join('') : 
        `<tr><td colspan="8" class="text-center">No eligible wines found that meet the contract requirements.</td></tr>`;

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
                                <p><strong>Requirement:</strong> Wine quality ≥ ${(contract.minQuality || 0.1) * 100}%</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Amount:</strong> ${contract.amount} bottles</p>
                                <p><strong>Price:</strong> €${contract.contractPrice.toFixed(2)}/bottle (Total: €${contract.totalValue.toFixed(2)})</p>
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
                                        <th>Vintage</th>
                                        <th>Field</th>
                                        <th>Quality</th>
                                        <th>Available</th>
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
            input.addEventListener('input', () => updateSelectedAmount(overlay, contract, quantityInputs));
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
