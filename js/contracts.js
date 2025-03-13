import { normalizeLandValue } from './names.js';
import { addConsoleMessage } from './console.js';
import { addTransaction } from './finance.js';
import { getGameState ,setPrestigeHit, getPrestigeHit, loadImporters, saveImporters, saveCompletedContract, savePendingContracts, loadPendingContracts as loadPendingContractsFromStorage, getCompletedContracts, getBaseImporterRelationshipSum } from './database/adminFunctions.js';
import { inventoryInstance } from './resource.js';
import { calculateRealPrestige } from './company.js';
import { updateAllDisplays } from './displayManager.js';
import { initializeImporters, updateAllImporterRelationships } from './classes/importerClass.js';
import { CONTRACT_GENERATION } from './constants/constants.js';
import { getColorClass, formatNumber } from './utils.js';

// Define requirement types as constants
const REQUIREMENT_TYPES = {
    QUALITY: 'quality',
    VINTAGE: 'vintage',
    BALANCE: 'balance',    // Add new balance requirement type
    // Future requirement types:
    // GRAPE_TYPE: 'grapeType',
    // LAND_VALUE: 'landValue',
    // ALTITUDE: 'altitude',
    // SOIL_TYPE: 'soilType',
    // REGION: 'region',
    // COUNTRY: 'country',
};

function createRequirement(type, value, params = {}) {
    return { type, value, params, 
        validate: (wine) => validateRequirement(type, value, wine, params), 
        getPremium: () => calculateRequirementPremium(type, value, params), 
        getDisplayHTML: () => formatRequirementHTML(type, value, params), 
        getDescription: () => getRequirementDescription(type, value, params) 
    };
}

function validateRequirement(type, value, wine, params) {
    const { year: gameYear } = getGameState();
    
    switch (type) {
        case REQUIREMENT_TYPES.QUALITY:
            return wine.quality >= value;
            
        case REQUIREMENT_TYPES.VINTAGE:
            if (params.isYear) {
                return wine.vintage <= value;
            }
            return wine.vintage <= (gameYear - value);
            
        case REQUIREMENT_TYPES.BALANCE:
            return wine.balance >= value;
            
        default:
            return true;
    }
}

function calculateRequirementPremium(type, value, params) {
    switch (type) {
        case REQUIREMENT_TYPES.QUALITY:
            return calculateQualityPricePremium(value);
            
        case REQUIREMENT_TYPES.VINTAGE:
            // For vintage, the value might be years of aging or a specific year
            const vintageAge = params.isYear 
                ? (params.referenceYear || new Date().getFullYear()) - value 
                : value;
            return calculateVintagePricePremium(vintageAge);
            
        case REQUIREMENT_TYPES.BALANCE:
            return calculateBalancePricePremium(value);
            
        // Add cases for future requirement types here
        default:
            return 0;
    }
}

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
            
        case REQUIREMENT_TYPES.BALANCE:
            const balanceColorClass = getColorClass(value);
            return `<strong>Balance <span class="${balanceColorClass}">(min ${formatNumber(value * 100)}%)</span></strong>`;
            
        // Add cases for future requirement types here
            
        default:
            return `<span class="text-warning">Unknown requirement</span>`;
    }
}

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
            
        case REQUIREMENT_TYPES.BALANCE:
            return `Balance ≥ ${(value * 100).toFixed(0)}%`;
            
        // Add cases for future requirement types here
            
        default:
            return "Unknown requirement";
    }
}

// Define requirement configuration schema
const REQUIREMENT_CONFIG = {
    [REQUIREMENT_TYPES.QUALITY]: {
        chance: 0.8,
        generateValue: (importer) => {
            const baseValue = Math.random();
            const isUnusualOrder = Math.random() < 0.10;
            
            let value;
            if (isUnusualOrder) {
                value = 0.1 + Math.random() * 0.85;
            } else {
                // Type-specific base values
                const typeBaseValues = {
                    "Private Importer": { base: 0.5, range: 0.5 },
                    "Restaurant": { base: 0.4, range: 0.5 },
                    "Wine Shop": { base: 0.2, range: 0.6 },
                    "Chain Store": { base: 0.1, range: 0.5 },
                    "default": { base: 0.1, range: 0.9 }
                };
                
                const config = typeBaseValues[importer.type] || typeBaseValues["default"];
                value = config.base + (baseValue * config.range);
            }
            
            // Random variance for natural variation
            const randomVariance = (Math.random() * 0.2) - 0.1;
            value = Math.max(0.1, Math.min(1.0, value + randomVariance));
                
            return value;
        },
        getParams: () => ({})
    },
    [REQUIREMENT_TYPES.VINTAGE]: {
        chance: 0.7,
        generateValue: (importer) => {
            const gameYear = localStorage.getItem('year') ? parseInt(localStorage.getItem('year')) : 2023;
            
            // Lambda values by importer type (lower = higher average age requirements)
            const lambdaValues = {
                "Private Importer": 0.15,  // Higher chance of requesting older vintages
                "Restaurant": 0.2,         // Good chance of requesting somewhat aged wines
                "Wine Shop": 0.25,         // Moderate chance of requesting aged wines
                "Chain Store": 0.3,        // Lower chance of requesting aged wines
                "default": 0.25            // Default lambda value
            };
            
            const lambda = lambdaValues[importer.type] || lambdaValues["default"];
            
            // Generate vintage age using exponential distribution
            const randomValue = Math.random();
            let vintageAge = Math.floor(-Math.log(1 - randomValue) / lambda);
            
            // Cap the maximum vintage age at 50 years
            vintageAge = Math.min(vintageAge, 50);
            
            // Ensure at least 1 year of aging if we're requesting a vintage
            vintageAge = Math.max(vintageAge, 1);
            
            return vintageAge;
        },
        getParams: () => {
            const gameYear = localStorage.getItem('year') ? parseInt(localStorage.getItem('year')) : 2023;
            return { referenceYear: gameYear };
        }
    },
    [REQUIREMENT_TYPES.BALANCE]: {
        chance: 0.6,  // Slightly lower chance than quality
        generateValue: (importer) => {
            const baseValue = Math.random();
            const isUnusualOrder = Math.random() < 0.10;
            
            let value;
            if (isUnusualOrder) {
                value = 0.1 + Math.random() * 0.85;
            } else {
                const typeBaseValues = {
                    "Private Importer": { base: 0.5, range: 0.5 },
                    "Restaurant": { base: 0.4, range: 0.5 },
                    "Wine Shop": { base: 0.2, range: 0.6 },
                    "Chain Store": { base: 0.1, range: 0.5 },
                    "default": { base: 0.1, range: 0.9 }
                };
                
                const config = typeBaseValues[importer.type] || typeBaseValues["default"];
                value = config.base + (baseValue * config.range);
            }
            
            const randomVariance = (Math.random() * 0.2) - 0.1;
            value = Math.max(0.1, Math.min(1.0, value + randomVariance));
            
            return value;
        },
        getParams: () => ({})
    }
    // Add new requirement types here with their generation configuration
};

// Define a central configuration for pricing calculations
const PRICING_CONFIG = {
    // Base price range calculation configuration
    basePriceRange: {
        calculate: (importer) => {
            // Default base prices
            let min = 5;  // Minimum €5 per bottle
            let max = 15; // Maximum €15 per bottle base price
            
            // Adjust based on importer type
            const typeRanges = {
                "Private Importer": { min: 10, max: 25 },  // Pay more for exclusivity
                "Restaurant": { min: 8, max: 20 },         // Pay slightly more than average
                "Wine Shop": { min: 6, max: 18 },          // Pay average prices
                "Chain Store": { min: 4, max: 12 }         // Negotiate lower prices due to volume
            };
            
            // Apply type-specific ranges if available
            if (typeRanges[importer.type]) {
                min = typeRanges[importer.type].min;
                max = typeRanges[importer.type].max;
            }
            
            // Adjust for purchasing power (wealthier markets have higher price ranges)
            min *= (0.8 + importer.purchasingPower * 0.4);
            max *= (0.8 + importer.purchasingPower * 0.6);
            
            // Adjust for wine tradition (traditional markets value wine more)
            min *= (0.9 + importer.wineTradition * 0.2);
            max *= (0.9 + importer.wineTradition * 0.3);
            
            return { min, max };
        }
    },
    
    // Quality premium calculation configuration
    qualityPremium: {
        calculate: (minQuality) => {
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
    },
    
    // Vintage premium calculation configuration
    vintagePremium: {
        calculate: (vintageAge) => {
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
    },
    
    // Add future pricing calculation configurations here as needed
};

function generateRequirements(importer) {
    const requirements = [];
    
    // Generate each type of requirement based on configuration
    Object.entries(REQUIREMENT_CONFIG).forEach(([type, config]) => {
        // Check if we should generate this requirement type based on chance
        if (Math.random() < config.chance) {
            // Generate value based on importer
            const value = config.generateValue(importer);
            // Get additional params
            const params = config.getParams();
            // Create and add requirement
            requirements.push(createRequirement(type, value, params));
        }
    });
    
    return requirements;
}

export function generateImporterContracts() {
    // Get all bottled wines with custom prices
    const winesWithPrices = inventoryInstance.getItemsByState('Bottles').filter(wine => wine.customPrice > 0);

    // If no wines have prices set, return false - no contracts should be generated
    if (winesWithPrices.length === 0) {
        return false;
    }

    // Check if we already have the maximum number of contracts
    const currentContracts = loadPendingContracts();
    if (currentContracts.length >= CONTRACT_GENERATION.MAX_PENDING_CONTRACTS) {
        return false;
    }
    
    // Get all importers and update their relationships
    let importers = loadImporters();
    
    if (!importers || importers.length === 0) {
        importers = initializeImporters();
    } else {
        importers = updateAllImporterRelationships();
    }

    // Filter to only include importers with relationship above threshold
    const { MIN_RELATIONSHIP_THRESHOLD } = CONTRACT_GENERATION;
    
    const eligibleImporters = importers.filter(importer => importer.relationship >= MIN_RELATIONSHIP_THRESHOLD);
    
    if (eligibleImporters.length === 0) {
        return false;
    }
    
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
    
    // Generate requirements based on importer
    const requirements = generateRequirements(selectedImporter);
    
    // Calculate combined price premium from all requirements
    let totalPremium = 0;
    let minQualityRequirement = 0;
    let minVintageAge = 0;
    
    requirements.forEach(req => {
        // Store requirement values for later use
        if (req.type === REQUIREMENT_TYPES.QUALITY) {
            minQualityRequirement = req.value;
        } else if (req.type === REQUIREMENT_TYPES.VINTAGE) {
            minVintageAge = req.value;
        }
        
        const premium = req.getPremium();
        totalPremium += premium;
    });
    
    // Calculate contract price using component-based pricing
    const basePriceRange = calculateContractBasePriceRange(selectedImporter);
    
    // Calculate amount - base amount is 60 plus random 0-600
    const baseAmount = Math.ceil(12 + Math.random() * 60);
    
    // Apply importer's multipliers (market share, type, etc.)
    const contractAmount = Math.max(10, Math.ceil(baseAmount * selectedImporter.buyAmountMultiplicator));
    
    const basePrice = basePriceRange.min + Math.random() * (basePriceRange.max - basePriceRange.min);
    const contractPrice = (basePrice + totalPremium) * selectedImporter.buyPriceMultiplicator;
    
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
    
    // Update displays after generating contract
    updateAllDisplays();
    
    return true;
}

function calculateContractBasePriceRange(importer) {
    return PRICING_CONFIG.basePriceRange.calculate(importer);
}

function calculateQualityPricePremium(minQuality) {
    return PRICING_CONFIG.qualityPremium.calculate(minQuality);
}

function calculateVintagePricePremium(vintageAge) {
    return PRICING_CONFIG.vintagePremium.calculate(vintageAge);
}

function calculateBalancePricePremium(value) {
    if (!value) return 0;
    
    if (value <= 0.4) {
        return value * 4;  // Slightly lower than quality premium
    } else if (value <= 0.7) {
        return 1.6 + (value - 0.4) * 40;
    } else if (value <= 0.9) {
        return 13.6 + (value - 0.7) * 150;
    } else {
        return 43.6 + Math.pow((value - 0.9) * 10, 2) * 130;
    }
}

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

export function loadPendingContracts() {
    return loadPendingContractsFromStorage(createRequirement);
}

function recreateRequirement(type, value, params = {}) {
    return createRequirement(type, value, params);
}

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
            // Use the new function to update relationship
            const relationshipChange = updateImporterRelationship(contract.importerId, contract, true);
            
            // Add relationship change to console message if significant
            if (Math.abs(relationshipChange) >= 0.1) {
                addConsoleMessage(
                    `Relationship with ${contract.importerName} improved by ${relationshipChange.toFixed(1)} points.`
                );
            }
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
    
    // Update relationship with the importer using the new function
    const importers = loadImporters();
    let relationshipChange = 0;

    if (contract.importerId >= 0 && contract.importerId < importers.length) {
        const currentImporter = importers[contract.importerId];

        // Get completed contracts only for this specific importer
        const completedContracts = getCompletedContracts();
        const previousContractsWithImporter = completedContracts.filter(c => 
            c.importerId === contract.importerId || (
                c.importerName === contract.importerName && 
                c.importerType === contract.importerType &&
                c.importerCountry === contract.importerCountry
            )
        ).length;

        // Calculate relationship change with importer-specific contract count
        relationshipChange = calculateRelationshipChange(contract, true, previousContractsWithImporter);
        
        // Calculate new relationship value
        const oldRelationship = currentImporter.relationship;
        const newRelationship = Math.max(0, Math.min(100, oldRelationship + relationshipChange));
        
        // Update both the importer's relationship and the contract's relationship
        currentImporter.relationship = newRelationship;
        contract.relationship = newRelationship;
        contract.relationshipChange = relationshipChange;
        
        // Save updated importer data
        saveImporters(importers);
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

export function rejectContract(contractIndex) {
    const pendingContracts = loadPendingContracts();
    if (contractIndex < 0 || contractIndex >= pendingContracts.length) {
        addConsoleMessage('Invalid contract index.');
        return false;
    }
    
    // Get the contract for messaging
    const contract = pendingContracts[contractIndex];
    
    // Update relationship with the importer - negative effect for rejecting
    if (contract.importerId >= 0) {
        const relationshipChange = updateImporterRelationship(contract.importerId, contract, false);
        
        // Add relationship change to console message if significant
        if (Math.abs(relationshipChange) >= 0.1) {
            addConsoleMessage(
                `Relationship with ${contract.importerName} decreased by ${Math.abs(relationshipChange).toFixed(1)} points.`
            );
        }
    }
    
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


function calculateRelationshipChange(contract, isAccepting, existingContractsWithImporter = 0) {

    // Logarithmic scaling for contract value (€1,000 = ~1 point, €10,000 = ~2.3 points, €100,000 = ~4.6 points)
    const valueComponent = Math.log10(Math.max(contract.totalValue, 100)) - 1;
    
    // Relationship multiplier now based on contracts with this specific importer
    // (starts at 1, grows to ~3 with many contracts with this importer)
    const contractMultiplier = 1 + Math.log10(Math.max(existingContractsWithImporter, 1));

    // Calculate base change (accepting: positive, rejecting: negative)
    let baseChange = valueComponent * contractMultiplier;
    
    // If rejecting, relationship loss is about 1/3 of what would be gained by accepting
    if (!isAccepting) {
        baseChange = -baseChange / 3;
    }


    // Apply diminishing returns based on current relationship level
    const currentRelationship = contract.relationship || 0;
    const diminishingFactor = 1 - (currentRelationship / 100);
    
    // Calculate final relationship change
    const finalChange = isAccepting ? 
        baseChange * diminishingFactor : 
        baseChange * Math.sqrt(diminishingFactor);

   
    return Math.max(-100, Math.min(100, finalChange));
}

/**
 * Update the relationship with an importer after a contract action
 * @param {number} importerId - The importer's ID
 * @param {Object} contract - The contract being accepted or rejected
 * @param {boolean} isAccepting - True if accepting, false if rejecting
 */
function updateImporterRelationship(importerId, contract, isAccepting) {
    const importers = loadImporters();
    if (importerId >= 0 && importerId < importers.length) {
        // Get number of completed contracts from the existing importer data
        const previousContractsWithImporter = importers[importerId].contracts?.length || 0;
        
        // Calculate relationship change using existing contracts count
        const relationshipChange = calculateRelationshipChange(contract, isAccepting, previousContractsWithImporter);
        
        // Calculate new relationship value
        const newRelationship = Math.max(0, Math.min(100, 
            importers[importerId].relationship + relationshipChange
        ));
        
        // Update both the importer's relationship and the contract's relationship
        importers[importerId].relationship = newRelationship;
        contract.relationship = newRelationship;
        
        // Save the updated importers to localStorage
        saveImporters(importers);
        
        return relationshipChange;
    }
    return 0;
}

// Export the constants and utility functions
export { 
    REQUIREMENT_TYPES,
    createRequirement,
    validateRequirement,
    calculateRequirementPremium,
    formatRequirementHTML,
    getRequirementDescription,
    calculateRelationshipChange,   // Export for testing/debugging
    updateImporterRelationship
};

export function shouldGenerateContract() {
    const baseRelationshipSum = getBaseImporterRelationshipSum();
    const importers = loadImporters();
    
    const currentRelationshipSum = importers?.reduce((sum, imp) => sum + imp.relationship, 0) || 0;
    const importerCount = importers?.length || 1;
    
    // Calculate average relationships instead of total
    const baseAvgRelationship = baseRelationshipSum / importerCount;
    const currentAvgRelationship = currentRelationshipSum / importerCount;
    
    console.log('[Contract Generation] Relationship calculations:', {
        baseRelationshipSum,
        currentRelationshipSum,
        importerCount,
        baseAvgRelationship,
        currentAvgRelationship,
        difference: currentAvgRelationship - baseAvgRelationship,
        detailedRelationships: importers?.map(imp => ({
            name: imp.name,
            type: imp.type,
            country: imp.country,
            relationship: imp.relationship
        }))
    });

    // Calculate contract chance
    const prestige = calculateRealPrestige();
    const contracts = loadPendingContracts();
    
    // Base chance from prestige
    const baseChance = CONTRACT_GENERATION.BASE_CHANCE.MIN + 
        Math.min(prestige / CONTRACT_GENERATION.BASE_CHANCE.SCALE, 1) * 
        (CONTRACT_GENERATION.BASE_CHANCE.MAX - CONTRACT_GENERATION.BASE_CHANCE.MIN);
    
    // Diminishing returns from pending contracts
    const pendingPenalty = Math.max(
        CONTRACT_GENERATION.PENDING_CONTRACT_PENALTY.MIN,
        1 / Math.pow(contracts.length + 1, CONTRACT_GENERATION.PENDING_CONTRACT_PENALTY.POWER)
    );
    
    // Use average relationships for ratio
    const relationshipRatio = Math.min(currentAvgRelationship / baseAvgRelationship, 10);
    const relationshipModifier = relationshipRatio >= 1 ? 
        (1 + Math.min((relationshipRatio - 1) * CONTRACT_GENERATION.RELATIONSHIP_RATIO.MAX_BONUS, CONTRACT_GENERATION.RELATIONSHIP_RATIO.MAX_BONUS)) :
        (1 - Math.min((1 - relationshipRatio) * CONTRACT_GENERATION.RELATIONSHIP_RATIO.PENALTY, CONTRACT_GENERATION.RELATIONSHIP_RATIO.PENALTY));
    
    // Calculate final chance with a hard cap
    const finalChance = Math.min(baseChance * pendingPenalty * relationshipModifier, 0.95); // Cap at 95%
    
    // Log details
    console.log('[Contract Generation] Chance calculation:', {
        prestige,
        baseChance: baseChance.toFixed(3),
        pendingContracts: contracts.length,
        pendingPenalty: pendingPenalty.toFixed(3),
        relationshipRatio: relationshipRatio.toFixed(3),
        relationshipModifier: relationshipModifier.toFixed(3),
        finalChance: finalChance.toFixed(3)
    });
    
    const roll = Math.random();
    const shouldGenerate = roll < finalChance;
    
    if (shouldGenerate) {
        console.log(`[Contract Generation] Roll successful (${(roll * 100).toFixed(1)}% < ${(finalChance * 100).toFixed(1)}%)`);
    }
    
    return shouldGenerate;
}
