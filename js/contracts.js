import { normalizeLandValue } from './names.js';
import { addConsoleMessage } from './console.js';
import { addTransaction } from './finance.js';
import { 
    setPrestigeHit, 
    getPrestigeHit, 
    loadImporters, 
    saveImporters, 
    saveCompletedContract,
    savePendingContracts,
    loadPendingContracts as loadPendingContractsFromStorage
} from './database/adminFunctions.js';
import { inventoryInstance } from './resource.js';
import { calculateRealPrestige } from './company.js';
import { updateAllDisplays } from './displayManager.js';
import { calculateWinePrice } from './sales.js';
import { initializeImporters, updateAllImporterRelationships } from './classes/importerClass.js';
import { CONTRACT_GENERATION } from './constants/constants.js';
import { getColorClass, getFlagIconHTML, formatNumber } from './utils.js';

// Define requirement types as constants
const REQUIREMENT_TYPES = {
    QUALITY: 'quality',
    VINTAGE: 'vintage',
    // Future requirement types:
    // GRAPE_TYPE: 'grapeType',
    // LAND_VALUE: 'landValue',
    // ALTITUDE: 'altitude',
    // SOIL_TYPE: 'soilType',
    // REGION: 'region',
    // COUNTRY: 'country',
};

/**
 * Creates a requirement object for a contract
 * @param {string} type - The type of requirement (from REQUIREMENT_TYPES)
 * @param {*} value - The value for the requirement
 * @param {Object} params - Additional parameters specific to this requirement type
 * @returns {Object} - A requirement object
 */
function createRequirement(type, value, params = {}) {
    return {
        type,
        value,
        params,
        // Each requirement gets its own validation function
        validate: (wine) => validateRequirement(type, value, wine, params),
        // Each requirement gets its own price premium calculation
        getPremium: () => calculateRequirementPremium(type, value, params),
        // Each requirement gets its own display formatter
        getDisplayHTML: () => formatRequirementHTML(type, value, params),
        // Human-readable description of the requirement
        getDescription: () => getRequirementDescription(type, value, params)
    };
}

/**
 * Validates if a wine meets a specific requirement
 * @param {string} type - The type of requirement
 * @param {*} value - The requirement value
 * @param {Object} wine - The wine to check
 * @param {Object} params - Additional parameters
 * @returns {boolean} - True if the wine meets the requirement
 */
function validateRequirement(type, value, wine, params) {
    const gameYear = localStorage.getItem('year') ? parseInt(localStorage.getItem('year')) : new Date().getFullYear();
    
    switch (type) {
        case REQUIREMENT_TYPES.QUALITY:
            return wine.quality >= value;
            
        case REQUIREMENT_TYPES.VINTAGE:
            // If value is a required year, compare directly
            if (params.isYear) {
                return wine.vintage <= value;
            }
            // If value is an age, compare with current year
            return wine.vintage <= (gameYear - value);
            
        // Add cases for future requirement types here

        default:
            console.warn(`Unknown requirement type: ${type}`);
            return true; // Default to true for unknown types
    }
}

/**
 * Calculates the price premium for a specific requirement
 * @param {string} type - The type of requirement
 * @param {*} value - The requirement value
 * @param {Object} params - Additional parameters
 * @returns {number} - The price premium in euros
 */
function calculateRequirementPremium(type, value, params) {
    switch (type) {
        case REQUIREMENT_TYPES.QUALITY:
            // Reuse existing quality premium calculation
            return calculateQualityPricePremium(value);
            
        case REQUIREMENT_TYPES.VINTAGE:
            // For vintage, the value might be years of aging or a specific year
            const vintageAge = params.isYear 
                ? (params.referenceYear || new Date().getFullYear()) - value 
                : value;
            return calculateVintagePricePremium(vintageAge);
            
        // Add cases for future requirement types here
            
        default:
            console.warn(`Unknown requirement type for premium calculation: ${type}`);
            return 0;
    }
}

/**
 * Creates HTML representation of a requirement for display
 * @param {string} type - The type of requirement
 * @param {*} value - The requirement value
 * @param {Object} params - Additional parameters
 * @returns {string} - HTML representation of the requirement
 */
function formatRequirementHTML(type, value, params) {
    const gameYear = localStorage.getItem('year') ? parseInt(localStorage.getItem('year')) : new Date().getFullYear();
    
    switch (type) {
        case REQUIREMENT_TYPES.QUALITY:
            const qualityColorClass = getColorClass(value);
            return `<strong>Quality <span class="${qualityColorClass}">(min ${formatNumber(value * 100)}%)</span></strong>`;
            
        case REQUIREMENT_TYPES.VINTAGE:
            // If it's a year requirement
            if (params.isYear) {
                const age = gameYear - value;
                const vintageClass = getColorClass(Math.min(age / 5, 0.95));
                return `<strong>Vintage <span class="${vintageClass}">${value} or older</span></strong>`;
            }
            // If it's an age requirement
            else {
                const requiredYear = gameYear - value;
                const vintageClass = getColorClass(Math.min(value / 5, 0.95));
                return `<strong>Vintage <span class="${vintageClass}">${requiredYear} or older</span> (${value} years)</strong>`;
            }
            
        // Add cases for future requirement types here
            
        default:
            console.warn(`Unknown requirement type for HTML formatting: ${type}`);
            return `<span class="text-warning">Unknown requirement</span>`;
    }
}

/**
 * Gets a human-readable description of a requirement
 * @param {string} type - The type of requirement
 * @param {*} value - The requirement value
 * @param {Object} params - Additional parameters
 * @returns {string} - Human-readable description
 */
function getRequirementDescription(type, value, params) {
    const gameYear = localStorage.getItem('year') ? parseInt(localStorage.getItem('year')) : new Date().getFullYear();
    
    switch (type) {
        case REQUIREMENT_TYPES.QUALITY:
            return `Quality ≥ ${(value * 100).toFixed(0)}%`;
            
        case REQUIREMENT_TYPES.VINTAGE:
            if (params.isYear) {
                return `Vintage ${value} or older`;
            } else {
                const requiredYear = gameYear - value;
                return `Vintage ${requiredYear} or older (${value} years aging)`;
            }
            
        // Add cases for future requirement types here
            
        default:
            return "Unknown requirement";
    }
}

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
    const MAX_PENDING_CONTRACTS = 5;
    
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
    
    // Initialize requirements array for this contract
    const requirements = [];
    
    // Determine if this contract will have a quality requirement (80% chance)
    let minQualityRequirement = 0; // Change from 0.1 to 0 to represent no requirement
    let hasQualityRequirement = Math.random() < 0.8;
    
    if (hasQualityRequirement) {
        // Set quality requirements with more randomness
        // Base quality is a random value between 0-1
        const baseQuality = Math.random();
        
        // Determine if this is an "unusual" order (10% chance of ignoring typical type preferences)
        const isUnusualOrder = Math.random() < 0.10;
        
        // Full range with high randomness if it's an unusual order
        if (isUnusualOrder) {
            // For unusual orders, use a different distribution that's less tied to importer type
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
        
        // Add quality requirement to the requirements array
        requirements.push(createRequirement(REQUIREMENT_TYPES.QUALITY, minQualityRequirement));
    } else {
        minQualityRequirement = 0; // Explicitly set to 0 for "no requirement"
        console.log(`[Contracts] No quality requirement for this contract`);
    }
    
    // Get the current game year for vintage requirements
    const gameYear = localStorage.getItem('year') ? parseInt(localStorage.getItem('year')) : 2023;
    
    // Determine vintage requirements using exponential distribution for rarity
    let minVintageAge = 0;
    
    // First decide if this contract will have a vintage requirement
    // 70% chance of having a vintage requirement (down from the previous 90%)
    if (Math.random() < 0.7) {
        // Base vintage distribution with exponential falloff for higher values
        // Formula: -ln(1-x)/λ where x is random between 0-1 and λ controls the shape
        // Lambda values by importer type (lower = higher average age requirements)
        let lambda;
        
        switch(selectedImporter.type) {
            case "Private Importer":
                // Private importers value aged wines the most
                lambda = 0.15;  // Higher chance of requesting older vintages
                break;
            case "Restaurant":
                lambda = 0.2;   // Good chance of requesting somewhat aged wines
                break;
            case "Wine Shop":
                lambda = 0.25;  // Moderate chance of requesting aged wines
                break;
            case "Chain Store":
                lambda = 0.3;   // Lower chance of requesting aged wines
                break;
            default:
                lambda = 0.25;  // Default lambda value
        }
        
        // Generate vintage age using exponential distribution
        const randomValue = Math.random();
        minVintageAge = Math.floor(-Math.log(1 - randomValue) / lambda);
        
        // Cap the maximum vintage age at 50 years
        minVintageAge = Math.min(minVintageAge, 50);
        
        // Ensure at least 1 year of aging if we're requesting a vintage
        minVintageAge = Math.max(minVintageAge, 1);
        
        console.log(`[Contracts] Generated vintage age requirement: ${minVintageAge} years (λ=${lambda})`);
        
        // Add vintage requirement to the requirements array
        // Reference year is game year for future calculations
        requirements.push(createRequirement(REQUIREMENT_TYPES.VINTAGE, minVintageAge, {
            referenceYear: gameYear
        }));
    }
    
    // Calculate required vintage year based on age
    const requiredVintageYear = minVintageAge > 0 ? gameYear - minVintageAge : 0;
    
    console.log(`[Contracts] Vintage requirement: ${minVintageAge > 0 ? 
        `${minVintageAge} years (${requiredVintageYear} or older)` : 
        'No minimum vintage'}`);
    
    // Calculate combined price premium from all requirements
    let totalPremium = 0;
    requirements.forEach(req => {
        const premium = req.getPremium();
        totalPremium += premium;
        console.log(`[Contracts] ${req.getDescription()}: €${premium.toFixed(2)} premium`);
    });
    
    // Calculate contract price using component-based pricing
    const basePriceRange = calculateContractBasePriceRange(selectedImporter);
    const qualityPremium = calculateQualityPricePremium(minQualityRequirement);
    const vintagePremium = calculateVintagePricePremium(minVintageAge);
    
    // Calculate amount - larger than regular orders based on importer's market share
    const baseAmount = Math.max(10, Math.ceil(Math.random() * 20 + 10 * selectedImporter.marketShare / 10));
    const contractAmount = Math.max(10, Math.ceil(baseAmount * selectedImporter.buyAmountMultiplicator));
    
    // Contract price now includes vintage premium
    const basePrice = basePriceRange.min + Math.random() * (basePriceRange.max - basePriceRange.min);
    const contractPrice = (basePrice + totalPremium) * selectedImporter.buyPriceMultiplicator;
    
    console.log(`[Contracts] Price calculation:`, {
        baseRange: `€${basePriceRange.min.toFixed(2)} - €${basePriceRange.max.toFixed(2)}`,
        basePrice: `€${basePrice.toFixed(2)}`,
        qualityPremium: `€${qualityPremium.toFixed(2)} (for ${(minQualityRequirement * 100).toFixed(1)}% min quality)`,
        vintagePremium: `€${vintagePremium.toFixed(2)} (for ${minVintageAge} years aging)`,
        importerMultiplier: selectedImporter.buyPriceMultiplicator.toFixed(2),
        finalPrice: `€${contractPrice.toFixed(2)}`
    });
    
    // Create contract object with new requirements system
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
        requirements: requirements
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
 * Calculate price premium based on vintage age requirements
 * @param {number} vintageAge - Required vintage age in years
 * @returns {number} - Price premium in euros per bottle
 */
function calculateVintagePricePremium(vintageAge) {
    // No vintage requirement means no premium
    if (!vintageAge || vintageAge <= 0) return 0;
    
    // Enhanced premium calculation for wider vintage range (0-50 years)
    // Uses progressive scaling:
    // - 1-5 years: modest premium (€1-10)
    // - 6-15 years: significant premium (€10-50)
    // - 16-30 years: substantial premium (€50-200)
    // - 31-50 years: exceptional premium (€200-1000+)
    
    if (vintageAge <= 5) {
        // Linear increase for young wines (€1-10)
        return vintageAge * 2;
    } else if (vintageAge <= 15) {
        // Growing premium for mature wines (€10-50)
        return 10 + Math.pow(vintageAge - 5, 1.5) * 2;
    } else if (vintageAge <= 30) {
        // Steeper growth for old wines (€50-200)
        return 50 + Math.pow(vintageAge - 15, 1.7) * 3;
    } else {
        // Exponential growth for very old wines (€200-1000+)
        // This creates exceptional premiums for very rare vintage requirements
        return 200 + Math.pow(vintageAge - 30, 2.2) * 5;
    }
}

/**
 * Save a new contract to localStorage
 */
export function saveNewContract(contract) {
    const currentContracts = loadPendingContracts();
    currentContracts.push(contract);
    savePendingContracts(currentContracts);
    
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
    return loadPendingContractsFromStorage(createRequirement);
}

/**
 * Recreate a requirement object from plain data
 * @param {string} type - The type of requirement
 * @param {*} value - The requirement value
 * @param {Object} params - Additional parameters
 * @returns {Object} - A new requirement object with methods
 */
function recreateRequirement(type, value, params = {}) {
    return createRequirement(type, value, params);
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
        savePendingContracts(pendingContracts);
        
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
    
    // Validate against all requirements
    if (contract.requirements && contract.requirements.length > 0) {
        // For each selected wine, check if it meets all requirements
        for (const wine of selectedWines) {
            // Find requirements that this wine doesn't meet
            const failedRequirements = contract.requirements.filter(req => !req.validate(wine));
            
            if (failedRequirements.length > 0) {
                // Get descriptions of failed requirements for the message
                const requirementDescriptions = failedRequirements.map(req => req.getDescription()).join(', ');
                addConsoleMessage(`Some selected wines don't meet the requirements: ${requirementDescriptions}`);
                return false;
            }
        }
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
    savePendingContracts(pendingContracts);
    
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
 * Check if a wine meets all requirements of a contract
 * @param {Object} wine - The wine to check
 * @param {Object} contract - The contract with requirements
 * @returns {boolean} - True if wine meets all requirements
 */
export function wineMatchesAllRequirements(wine, contract) {
    // If the contract uses the new requirements system
    if (Array.isArray(contract.requirements)) {
        // If there are no requirements, all wines match
        if (contract.requirements.length === 0) {
            return true;
        }
        
        // Check each requirement
        return contract.requirements.every(req => req.validate(wine));
    }
    
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
    savePendingContracts(pendingContracts);
    
    // Add console message
    addConsoleMessage(
        `Rejected contract from ${contract.importerType} (${contract.importerCountry}) for ` +
        `${contract.amount} bottles of ${contract.resourceName}.`
    );
    

    return true;
}

// Export the constants and utility functions
export { 
    REQUIREMENT_TYPES,
    createRequirement,
    validateRequirement,
    calculateRequirementPremium,
    formatRequirementHTML,
    getRequirementDescription
};
