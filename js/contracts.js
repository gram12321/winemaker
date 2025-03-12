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
    
    // Select a single random eligible importer
    const selectedImporter = eligibleImporters[Math.floor(Math.random() * eligibleImporters.length)];
    console.log(`[Contracts] Selected importer: ${selectedImporter.type} (${selectedImporter.country}) with relationship ${selectedImporter.relationship.toFixed(1)}`);
    
    // Select a suitable wine for this contract
    // Filter wines by quality - importers prefer higher quality for contracts
    const qualityThreshold = 0.7; // Minimum quality threshold (70%)
    const highQualityWines = winesWithPrices.filter(wine => wine.quality >= qualityThreshold);
    
    // If no high-quality wines available, use any wine with a price
    const availableWines = highQualityWines.length > 0 ? highQualityWines : winesWithPrices;
    const selectedWine = availableWines[Math.floor(Math.random() * availableWines.length)];
    
    if (!selectedWine) {
        console.log("[Contracts] No suitable wine found for contract");
        console.groupEnd();
        return false;
    }
    
    console.log(`[Contracts] Selected wine: ${selectedWine.resource.name}, Vintage ${selectedWine.vintage}, Quality ${(selectedWine.quality * 100).toFixed(0)}%`);
    
    // Calculate contract amount - larger than regular orders
    // Based on importer's market share and buyAmountMultiplicator
    const baseAmount = Math.max(10, Math.ceil(Math.random() * 20 + 10 * selectedImporter.marketShare / 10));
    
    // Apply importer's multipliers
    const contractAmount = Math.max(10, Math.ceil(baseAmount * selectedImporter.buyAmountMultiplicator));
    
    // Base price per bottle (from the wine's custom price)
    // Contracts use calculated base price with importer's preferential rate
    const calculatedBasePrice = calculateWinePrice(selectedWine.quality, selectedWine, true);
    const contractPrice = selectedWine.customPrice * selectedImporter.buyPriceMultiplicator;  // FIXED: Use custom price instead of calculated base price
    
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
        marketShare: selectedImporter.marketShare,  // Add market share
        relationship: selectedImporter.relationship, // Add relationship value
        requirements: {
            description: "Quality wine",
            minQuality: 0.1
        },
        minQuality: 0.1
    };
    
    // Save this contract to localStorage
    saveNewContract(contract);
    
    console.log(`[Contracts] Contract generated: ${contractAmount} bottles of ${selectedWine.resource.name} at €${contractPrice.toFixed(2)}/bottle (Total: €${contract.totalValue.toFixed(2)})`);
    console.groupEnd();
    
    // Update displays after generating contract
    updateAllDisplays();
    
    return true;
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
    
    // Save the completed contract
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
