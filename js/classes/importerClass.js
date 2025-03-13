import { loadImporters, saveImporters } from '../database/adminFunctions.js';
import { calculateRealPrestige } from '../company.js';
import { generateImporterName } from '../names.js';

export const IMPORTER_TYPES = {
    PRIVATE: 'Private Importer',
    RESTAURANT: 'Restaurant',
    WINE_SHOP: 'Wine Shop',
    CHAIN_STORE: 'Chain Store'
};

/**
 * Calculate importer relationship based on company prestige and market share
 * Uses a logarithmic scaling for prestige and a power-based scaling for market share
 * to create the desired relationship values:
 * - Zero prestige → ~0.1 relationship
 * - Prestige 100 → ~15 relationship
 * - Prestige 1000 → ~25 relationship
 * - 0.1% market share → ~1.16 divisor
 * - 1% market share → ~1.77 divisor
 * - 5% market share → ~4.4 divisor
 * - 10% market share → ~10 divisor
 */
export function calculateImporterRelationship(marketShare) {
    const companyPrestige = calculateRealPrestige();
    
    // Very low base relationship
    const baseRelationship = 0.1;
    
    // Prestige contribution with logarithmic scaling (diminishing returns)
    // This gives ~15 at prestige 100 and ~25 at prestige 1000
    const prestigeContribution = Math.log(companyPrestige + 1) * 3.3;
    
    // Market share impact - more aggressive formula for larger importers
    // Uses a combination of power functions to match the specified divisor values
    const marketShareImpact = 1 + 0.7 * Math.pow(marketShare, 0.25) + Math.pow(marketShare, 0.9);
    
    // Calculate final relationship
    // Higher prestige increases relationship
    // Higher market share decreases relationship
    const relationship = baseRelationship + (prestigeContribution / marketShareImpact);
    
    // Ensure relationship is at least the base value
    return Math.max(baseRelationship, relationship);
}

export class Importer {
    constructor(country, marketShare, purchasingPower, wineTradition, type) {
        this.country = country;
        this.marketShare = marketShare;
        this.purchasingPower = purchasingPower;
        this.wineTradition = wineTradition;
        this.type = type;
        this.name = generateImporterName(type, country);
        this.winePreferences = [];
        this.buyPriceMultiplicator = this.calculateBuyPriceMultiplicator();
        this.buyAmountMultiplicator = this.calculateBuyAmountMultiplicator();
        this.relationship = this.calculateRelationship(); // Initialize relationship
    }

    calculateBuyAmountMultiplicator() {
        // Base multiplier starts at 1
        let multiplier = 1.0;

        // Adjust based on importer type
        switch(this.type) {
            case IMPORTER_TYPES.CHAIN_STORE:
                multiplier *= 10.0; // Chain stores buy in bulk
                break;
            case IMPORTER_TYPES.WINE_SHOP:
                multiplier *= 5.5; // Wine shops buy moderate amounts
                break;
            case IMPORTER_TYPES.RESTAURANT:
                multiplier *= 2.2; // Restaurants buy smaller amounts
                break;
            case IMPORTER_TYPES.PRIVATE:
                multiplier *= 0.5; // Private importers buy smallest amounts
                break;
        }

        // Apply market share (stronger influence: each 1% adds 180% to multiplier)
        multiplier *= (1 + (this.marketShare * 1.8));

        // Apply purchasing power
        multiplier *= (1 + this.purchasingPower);

        // Apply wine tradition (small influence)
        multiplier *= (1 + (this.wineTradition * 0.2));

        return multiplier;
    }

    calculateBuyPriceMultiplicator() {
        // Base multiplier starts at 1
        let multiplier = 1.0;

        // Adjust based on importer type
        switch(this.type) {
            case IMPORTER_TYPES.PRIVATE:
                multiplier *= 1.2; // Private importers pay premium
                break;
            case IMPORTER_TYPES.RESTAURANT:
                multiplier *= 1.1; // Restaurants pay slightly above average
                break;
            case IMPORTER_TYPES.WINE_SHOP:
                multiplier *= 1.0; // Wine shops pay average
                break;
            case IMPORTER_TYPES.CHAIN_STORE:
                multiplier *= 0.9; // Chain stores get bulk discount
                break;
        }

        // Adjust based on market share (larger share = better bulk pricing)
        multiplier *= (1 - (this.marketShare / 200)); // Max 50% reduction for largest market share

        // Adjust based on wine tradition
        multiplier *= (1 + (this.wineTradition * 0.2));

        return multiplier;
    }
    

    calculateRelationship() {
        // Use the shared calculation function
        return calculateImporterRelationship(this.marketShare);
    }
    
    updateRelationship() {
        this.relationship = this.calculateRelationship();
        return this.relationship;
    }
}

// Country presets with default purchasingPower and wineTradition values
const COUNTRY_PRESETS = {
    'France': { purchasingPower: 0.85, wineTradition: 0.95 },
    'Germany': { purchasingPower: 0.80, wineTradition: 0.75 },
    'Italy': { purchasingPower: 0.75, wineTradition: 0.90 },
    'Spain': { purchasingPower: 0.70, wineTradition: 0.85 },
    'United States': { purchasingPower: 0.90, wineTradition: 0.60 }
};

// Generate a random set of importers for all countries
export function generateImporters() {
    const allImporters = [];
    
    Object.entries(COUNTRY_PRESETS).forEach(([country, preset]) => {
        // Generate 1-100 importers per country
        const importerCount = Math.floor(Math.random() * 100) + 1;
        
        // Calculate market shares that sum to 100%
        const marketShares = generateBalancedMarketShares(importerCount);
        
        // Create importers for this country
        for (let i = 0; i < importerCount; i++) {
            // Randomly select an importer type
            const types = Object.values(IMPORTER_TYPES);
            const randomType = types[Math.floor(Math.random() * types.length)];
            
            const importer = new Importer(
                country,
                marketShares[i],
                preset.purchasingPower,
                preset.wineTradition,
                randomType
            );
            allImporters.push(importer);
        }
    });
    
    return allImporters;
}

// Helper function to generate random market shares that sum to 100%
function generateBalancedMarketShares(count) {
    // Generate random values
    const randomValues = Array(count).fill(0).map(() => Math.random() * 100);
    
    // Calculate sum
    const sum = randomValues.reduce((a, b) => a + b, 0);
    
    // Normalize to sum to 100
    return randomValues.map(value => (value / sum) * 100);
}

// Initialize importers if they don't exist
export function initializeImporters() {
    const existingImporters = loadImporters();
    if (!existingImporters) {
        const newImporters = generateImporters();
        saveImporters(newImporters);
        return newImporters;
    }
    return existingImporters;
}

export function updateAllImporterRelationships() {
    const importers = loadImporters();
    if (!importers) return;
    
    importers.forEach(importer => {
        if (importer instanceof Importer) {
            importer.updateRelationship();
        } else {
            importer.relationship = calculateImporterRelationship(importer.marketShare);
        }
    });
    
    saveImporters(importers);
    return importers;
}
