import { loadImporters, saveImporters } from '../database/adminFunctions.js';

export const IMPORTER_TYPES = {
    PRIVATE: 'Private Importer',
    RESTAURANT: 'Restaurant',
    WINE_SHOP: 'Wine Shop',
    CHAIN_STORE: 'Chain Store'
};

export class Importer {
    constructor(country, marketShare, purchasingPower, wineTradition, type) {
        this.country = country;
        this.marketShare = marketShare;
        this.purchasingPower = purchasingPower;
        this.wineTradition = wineTradition;
        this.type = type;
        this.winePreferences = [];
        this.buyPriceMultiplicator = this.calculateBuyPriceMultiplicator();
        this.buyAmountMultiplicator = this.calculateBuyAmountMultiplicator();
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

        // Adjust based on market share
        multiplier *= (1 + (this.marketShare / 100));

        // Ensure multiplier stays within reasonable bounds (0.5 to 3.0)
        return Math.max(0.5, Math.min(3.0, multiplier));
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

        // Adjust based on purchasing power
        multiplier *= (1 + this.purchasingPower);

        // Adjust based on wine tradition (higher tradition = willing to pay more for quality)
        multiplier *= (1 + (this.wineTradition * 0.2));

        // Ensure multiplier stays within reasonable bounds (0.5 to 2.0)
        return Math.max(0.5, Math.min(2.0, multiplier));
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
