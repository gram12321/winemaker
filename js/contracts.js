import { normalizeLandValue } from './names.js';
import { addConsoleMessage } from './console.js';
import { addTransaction } from './finance.js';
import { setPrestigeHit, getPrestigeHit } from './database/adminFunctions.js';
import { inventoryInstance } from './resource.js';
import { calculateRealPrestige } from './company.js';
import { loadImporters, saveImporters, saveCompletedContract } from './database/adminFunctions.js';
import { updateAllDisplays } from './displayManager.js';
import { calculateWinePrice } from './sales.js';
import { initializeImporters, updateAllImporterRelationships } from './classes/importerClass.js';
import { CONTRACT_GENERATION } from './constants/constants.js';

/**
 * Generates potential wine contracts from importers based on reputation and relationship
 * This creates bulk orders with potentially higher volumes than regular orders
 * Returns true if any contracts were generated, false otherwise
 */
export function generateImporterContracts() {
    // Get all bottled wines with custom prices
    const winesWithPrices = inventoryInstance.getItemsByState('Bottles').filter(wine => wine.customPrice > 0);

    // If no wines have prices set, return false - no contracts should be generated
    if (winesWithPrices.length === 0) {
        console.log("[Contracts] No wines with prices set - cannot generate contracts");
        return false;
    }

    // Check if we already have the maximum number of contracts
    const currentContracts = loadPendingContracts();
    const MAX_PENDING_CONTRACTS = 3;
    
    if (currentContracts.length >= MAX_PENDING_CONTRACTS) {
        console.log(`[Contracts] Already at maximum pending contracts (${MAX_PENDING_CONTRACTS}). No new contracts will be generated.`);
        return false;
    }
    
    // Get all importers and update their relationships
    let importers = loadImporters();
    console.log(`[Contracts] Loaded ${importers ? importers.length : 0} importers`);
    
    if (!importers || importers.length === 0) {
        console.log("[Contracts] No importers found, initializing...");
        importers = initializeImporters();
        console.log(`[Contracts] Initialized ${importers.length} importers`);
    } else {
        console.log("[Contracts] Updating importer relationships...");
        importers = updateAllImporterRelationships();
    }

    // Filter to only include importers with relationship above threshold
    const { MIN_RELATIONSHIP_THRESHOLD } = CONTRACT_GENERATION;
    console.log(`[Contracts] Minimum relationship threshold: ${MIN_RELATIONSHIP_THRESHOLD}`);
    
    const eligibleImporters = importers.filter(importer => importer.relationship >= MIN_RELATIONSHIP_THRESHOLD);
    
    if (eligibleImporters.length === 0) {
        console.log("[Contracts] No importers with sufficient relationship found");
        return false;
    }

    // Log contract generation attempt
    console.group("[Contract Generation] Generating importer contract");
    console.log(`${eligibleImporters.length} eligible importers with relationship >= ${MIN_RELATIONSHIP_THRESHOLD}`);
    
    // Weight selection by relationship value using relationship-based weighting
    const totalWeight = eligibleImporters.reduce((sum, importer) => sum + Math.pow(importer.relationship, 2), 0);
    let randomValue = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    let selectedImporter;
    
    // Select an importer using weighted random selection
    for (const importer of eligibleImporters) {
        cumulativeWeight += Math.pow(importer.relationship, 2);
        if (randomValue <= cumulativeWeight) {
            selectedImporter = importer;
            break;
        }
    }
    
    // Fallback to the last importer if the loop somehow didn't select one
    if (!selectedImporter) {
        selectedImporter = eligibleImporters[eligibleImporters.length - 1];
    }
    
    console.log(`[Contracts] Selected importer: ${selectedImporter.name} (${selectedImporter.type}, ${selectedImporter.country}) with relationship ${selectedImporter.relationship.toFixed(1)}`);
    
    // Add debug info about selection probabilities
    if (eligibleImporters.length > 1) {
        const probabilities = eligibleImporters.map(importer => ({
            name: importer.name,
            type: importer.type,
            country: importer.country,
            relationship: importer.relationship.toFixed(1),
            weight: Math.pow(importer.relationship, 2),
            probability: `${((Math.pow(importer.relationship, 2) / totalWeight) * 100).toFixed(1)}%`
        }));
        
        console.log("Selection probabilities (weighted by relationship²):");
        console.table(probabilities);
    }
    
    // Set quality requirements with more randomness
    // Base quality is now a true random value between 0-1
    const baseQuality = Math.random();
    
    // Determine if this is an "unusual" order (10% chance of ignoring typical type preferences)
    const isUnusualOrder = Math.random() < 0.10;
    
    // Full range with high randomness if it's an unusual order
    let minQualityRequirement;
    
    if (isUnusualOrder) {
        // For unusual orders, use a different distribution that's less tied to importer type
        // This creates orders that occasionally break the pattern
        minQualityRequirement = 0.1 + Math.random() * 0.85; // Full range
        console.log(`[Contracts] Generating unusual quality requirement (outside normal range for ${selectedImporter.type})`);
    } else {
        // Normal case: use importer type preferences
        switch(selectedImporter.type) {
            case "Private Importer":
                // Private importers often want high quality (biased 0.5-1.0)
                minQualityRequirement = 0.5 + (baseQuality * 0.5);
                break;
            case "Restaurant":
                // Restaurants typically want good to excellent quality (0.4-0.9)
                minQualityRequirement = 0.4 + (baseQuality * 0.5);
                break;
            case "Wine Shop":
                // Wine shops have varied requirements (0.2-0.8)
                minQualityRequirement = 0.2 + (baseQuality * 0.6);
                break;
            case "Chain Store":
                // Chain stores often accept lower quality (0.1-0.6)
                minQualityRequirement = 0.1 + (baseQuality * 0.5);
                break;
            default:
                // Default case with full range (0.1-1.0)
                minQualityRequirement = 0.1 + (baseQuality * 0.9);
        }
    }
    
    // Apply a larger random variance (-0.1 to +0.1) for more natural variation
    const randomVariance = (Math.random() * 0.2) - 0.1;
    minQualityRequirement = Math.max(0.1, Math.min(1.0, minQualityRequirement + randomVariance));
    
    console.log(`[Contracts] Setting minimum quality requirement: ${(minQualityRequirement * 100).toFixed(1)}%`);
    console.log(`[Contracts] Requirement breakdown:
        - Importer type (${selectedImporter.type}): Base requirement
        - Unusual order: ${isUnusualOrder ? 'Yes' : 'No'}
        - Random variance: ${(randomVariance * 100).toFixed(1)}%`);
    
    // Calculate contract price using component-based pricing
    const basePriceRange = calculateContractBasePriceRange(selectedImporter);
    const qualityPremium = calculateQualityPricePremium(minQualityRequirement);
    
    // Calculate amount - larger than regular orders based on importer's market share
    const baseAmount = Math.max(10, Math.ceil(Math.random() * 20 + 10 * selectedImporter.marketShare / 10));
    const contractAmount = Math.max(10, Math.ceil(baseAmount * selectedImporter.buyAmountMultiplicator));
    
    // Contract price is base price + quality premium, adjusted by importer multiplier
    const basePrice = basePriceRange.min + Math.random() * (basePriceRange.max - basePriceRange.min);
    const contractPrice = (basePrice + qualityPremium) * selectedImporter.buyPriceMultiplicator;
    
    console.log(`[Contracts] Price calculation:`, {
        baseRange: `€${basePriceRange.min.toFixed(2)} - €${basePriceRange.max.toFixed(2)}`,
        basePrice: `€${basePrice.toFixed(2)}`,
        qualityPremium: `€${qualityPremium.toFixed(2)} (for ${(minQualityRequirement * 100).toFixed(1)}% min quality)`,
        importerMultiplier: selectedImporter.buyPriceMultiplicator.toFixed(2),
        finalPrice: `€${contractPrice.toFixed(2)}`
    });
    
    // Create contract object
    const contract = {
        type: "Contract",
        amount: contractAmount,
        contractPrice: contractPrice,
        totalValue: contractPrice * contractAmount,
        importerCountry: selectedImporter.country,
        importerType: selectedImporter.type,
        importerName: selectedImporter.name,
        importerId: importers.indexOf(selectedImporter),
        marketShare: selectedImporter.marketShare,
        relationship: selectedImporter.relationship,
        minQuality: minQualityRequirement,
        requirements: {
            description: "Quality wine",
            minQuality: minQualityRequirement
        }
    };
    
    // Save this contract to localStorage
    saveNewContract(contract);
    
    console.log(`[Contracts] Contract generated: ${contractAmount} bottles at €${contractPrice.toFixed(2)}/bottle (Total: €${contract.totalValue.toFixed(2)})`);
    console.groupEnd();
    
    // Update displays after generating contract
    updateAllDisplays();
    
    return true;
}

/**
 * Calculate the base price range for a contract based on importer characteristics
 * @param {Object} importer - The importer object
 * @returns {Object} - Min and max base price range
 */
function calculateContractBasePriceRange(importer) {
    // Base price range depends on importer type and market characteristics
    let min = 5;  // Minimum €5 per bottle
    let max = 15; // Maximum €15 per bottle base price
    
    // Adjust based on importer type
    switch(importer.type) {
        case "Private Importer":
            // Private importers pay more for exclusivity
            min = 10;
            max = 25;
            break;
        case "Restaurant":
            // Restaurants pay slightly more than average
            min = 8;
            max = 20;
            break;
        case "Wine Shop":
            // Wine shops pay average prices
            min = 6;
            max = 18;
            break;
        case "Chain Store":
            // Chain stores negotiate lower prices due to volume
            min = 4;
            max = 12;
            break;
    }
    
    // Adjust for purchasing power (wealthier markets have higher price ranges)
    min *= (0.8 + importer.purchasingPower * 0.4);
    max *= (0.8 + importer.purchasingPower * 0.6);
    
    // Adjust for wine tradition (traditional markets value wine more)
    min *= (0.9 + importer.wineTradition * 0.2);
    max *= (0.9 + importer.wineTradition * 0.3);
    
    return { min, max };
}

/**
 * Calculate price premium based on quality requirements
 * @param {number} minQuality - Minimum quality requirement (0-1)
 * @returns {number} - Price premium in euros per bottle
 */
function calculateQualityPricePremium(minQuality) {
    // No quality requirement means no premium
    if (!minQuality) return 0;
    
    // Quality premium scales exponentially with higher requirements
    // Low requirements (10-40%): €0-2 premium
    // Medium requirements (40-70%): €2-15 premium
    // High requirements (70-90%): €15-50 premium
    // Very high requirements (90%+): €50-200+ premium
    
    if (minQuality <= 0.4) {
        // Linear increase for low quality requirements
        return minQuality * 5;
    } else if (minQuality <= 0.7) {
        // Steeper increase for medium quality
        return 2 + (minQuality - 0.4) * 45;
    } else if (minQuality <= 0.9) {
        // Even steeper for high quality
        return 15 + (minQuality - 0.7) * 175;
    } else {
        // Exponential for premium quality requirements
        return 50 + Math.pow((minQuality - 0.9) * 10, 2) * 150;
    }
}

/**
 * Save a new contract to localStorage
 */
export function saveNewContract(contract) {
    const currentContracts = loadPendingContracts();
    currentContracts.push(contract);
    localStorage.setItem('pendingContracts', JSON.stringify(currentContracts));
    
    // Try to update the display directly if the contracts tab is visible
    try {
        const contractsSection = document.getElementById('contracts-section');
        if (contractsSection && contractsSection.style.display !== 'none') {
            const contractsTabContent = document.getElementById('contracts-tab-content');
            if (contractsTabContent) {
                import('./overlays/mainpages/salesoverlay.js').then(module => {
                    if (typeof module.displayContractsTab === 'function') {
                        module.displayContractsTab();
                    }
                });
            }
        }
    } catch (err) {
        console.debug('Error updating contracts tab:', err);
    }
}

/**
 * Load all pending contracts from localStorage
 */
export function loadPendingContracts() {
    const savedContracts = localStorage.getItem('pendingContracts');
    return savedContracts ? JSON.parse(savedContracts) : [];
}

/**
 * Accept a contract - execute the sale immediately
 * @param {number} contractIndex - The index of the contract in pending contracts
 * @returns {boolean} - Whether the contract was successfully fulfilled
 */
export function fulfillContract(contractIndex) {
    const pendingContracts = loadPendingContracts();
    if (contractIndex < 0 || contractIndex >= pendingContracts.length) {
        addConsoleMessage('Invalid contract index.');
        return false;
    }
    
    // Get the contract
    const contract = pendingContracts[contractIndex];
    
    // Check for inventory availability
    const bottledWine = inventoryInstance.items.find(item =>
        item.resource.name === contract.resourceName &&
        item.state === 'Bottles' &&
        item.vintage === contract.vintage &&
        Math.abs(item.quality - contract.quality) < 0.001 // Float comparison
    );

    // If no matching wine or completely out of inventory, reject the contract
    if (!bottledWine || bottledWine.amount < contract.amount) {
        addConsoleMessage(`Not enough inventory to fulfill the contract for ${contract.resourceName}. Need ${contract.amount} bottles.`);
        return false;
    }

    // Remove from inventory
    if (inventoryInstance.removeResource(
        bottledWine.resource, 
        contract.amount, 
        'Bottles', 
        bottledWine.vintage, 
        bottledWine.storage
    )) {
        // Process payment
        addTransaction('Income', 'Contract Sale', contract.totalValue);
        
        // Remove from pending contracts
        pendingContracts.splice(contractIndex, 1);
        localStorage.setItem('pendingContracts', JSON.stringify(pendingContracts));
        
        // Update relationship with the importer
        const importers = loadImporters();
        if (contract.importerId >= 0 && contract.importerId < importers.length) {
            // Increase relationship by 2 points when a contract is fulfilled
            importers[contract.importerId].relationship += 2;
            saveImporters(importers);
        }
        
        // Increase prestige
        setPrestigeHit(getPrestigeHit() + contract.totalValue / 10000);
        calculateRealPrestige();
        
        // Add console message
        addConsoleMessage(
            `Fulfilled contract from ${contract.importerType} (${contract.importerCountry}) for ` +
            `${contract.amount} bottles of ${contract.resourceName}, Vintage ${contract.vintage}, ` +
            `Quality ${(contract.quality * 100).toFixed(0)}%. Received payment: €${contract.totalValue.toFixed(2)}.`
        );
        
        // Save inventory after successful transaction
        inventoryInstance.save();
        updateAllDisplays();
        
        return true;
    }
    
    return false;
}

/**
 * Accept a contract using specific selected wines
 * @param {number} contractIndex - The index of the contract in pending contracts
 * @param {Array} selectedWines - Array of wines to use for contract
 * @returns {boolean} - Whether the contract was successfully fulfilled
 */
export function fulfillContractWithSelectedWines(contractIndex, selectedWines) {
    const pendingContracts = loadPendingContracts();
    if (contractIndex < 0 || contractIndex >= pendingContracts.length) {
        addConsoleMessage('Invalid contract index.');
        return false;
    }
    
    // Get the contract
    const contract = pendingContracts[contractIndex];
    
    // Calculate total amount of selected wines
    const totalSelectedAmount = selectedWines.reduce((sum, wine) => sum + wine.amount, 0);
    
    // Check if the selected amount matches the contract amount
    if (totalSelectedAmount !== contract.amount) {
        addConsoleMessage(`The selected amount (${totalSelectedAmount}) doesn't match the contract requirement (${contract.amount}).`);
        return false;
    }
    
    // Check if each selected wine meets the contract requirements
    const invalidWines = selectedWines.filter(wine => wine.quality < (contract.minQuality || 0.1));
    if (invalidWines.length > 0) {
        addConsoleMessage(`Some selected wines don't meet the minimum quality requirement of ${(contract.minQuality || 0.1) * 100}%.`);
        return false;
    }
    
    // Remove the wines from inventory
    let allRemoved = true;
    let totalAmount = 0;
    
    for (const wine of selectedWines) {
        const bottledWine = inventoryInstance.items.find(item =>
            item.resource.name === wine.name &&
            item.state === 'Bottles' &&
            item.vintage === wine.vintage &&
            Math.abs(item.quality - wine.quality) < 0.001 &&
            item.fieldName === wine.fieldName &&
            (!wine.storage || item.storage === wine.storage)
        );
        
        if (!bottledWine || bottledWine.amount < wine.amount) {
            addConsoleMessage(`Not enough inventory of ${wine.name} (${wine.vintage}).`);
            allRemoved = false;
            break;
        }
        
        const removed = inventoryInstance.removeResource(
            bottledWine.resource,
            wine.amount,
            'Bottles',
            bottledWine.vintage,
            bottledWine.storage
        );
        
        if (!removed) {
            allRemoved = false;
            break;
        }
        
        totalAmount += wine.amount;
    }
    
    // If any removal failed, abort the operation
    if (!allRemoved) {
        addConsoleMessage('Failed to remove some wines from inventory. Contract not fulfilled.');
        return false;
    }
    
    // Add used wines details to contract before saving
    contract.usedWines = selectedWines.map(wine => ({
        name: wine.name,
        vintage: wine.vintage,
        fieldName: wine.fieldName,
        quality: wine.quality,
        amount: wine.amount
    }));
    
    // Save the completed contract with wine details
    saveCompletedContract(contract);
    
    // Process payment
    addTransaction('Income', 'Contract Sale', contract.totalValue);
    
    // Remove from pending contracts
    pendingContracts.splice(contractIndex, 1);
    localStorage.setItem('pendingContracts', JSON.stringify(pendingContracts));
    
    // Update relationship with the importer
    const importers = loadImporters();
    if (contract.importerId >= 0 && contract.importerId < importers.length) {
        // Increase relationship by 2 points when a contract is fulfilled
        importers[contract.importerId].relationship += 2;
        saveImporters(importers);
    }
    
    // Increase prestige
    setPrestigeHit(getPrestigeHit() + contract.totalValue / 10000);
    calculateRealPrestige();
    
    // Add console message
    addConsoleMessage(
        `Fulfilled contract from ${contract.importerType} (${contract.importerCountry}) for ` +
        `${totalAmount} bottles at €${contract.contractPrice.toFixed(2)}/bottle. ` +
        `Received payment: €${contract.totalValue.toFixed(2)}.`
    );
    
    // Save inventory after successful transaction
    inventoryInstance.save();
    
    // Update all displays after contract fulfillment
    updateAllDisplays();
    
    return true;
}

/**
 * Reject a pending contract
 * @param {number} contractIndex - The index of the contract in pending contracts
 * @returns {boolean} - Whether the contract was successfully rejected
 */
export function rejectContract(contractIndex) {
    const pendingContracts = loadPendingContracts();
    if (contractIndex < 0 || contractIndex >= pendingContracts.length) {
        addConsoleMessage('Invalid contract index.');
        return false;
    }
    
    // Get the contract for messaging
    const contract = pendingContracts[contractIndex];
    
    // Remove from pending contracts
    pendingContracts.splice(contractIndex, 1);
    localStorage.setItem('pendingContracts', JSON.stringify(pendingContracts));
    
    // Add console message
    addConsoleMessage(
        `Rejected contract from ${contract.importerType} (${contract.importerCountry}) for ` +
        `${contract.amount} bottles of ${contract.resourceName}.`
    );
    

    return true;
}
