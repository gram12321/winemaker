
// importerClass.js - Defines the Importer class for wine importers from different countries

export class Importer {
    constructor(country, marketShare, purchasingPower, wineTradition) {
        this.country = country;
        this.marketShare = marketShare;
        this.purchasingPower = purchasingPower;
        this.wineTradition = wineTradition;
        this.winePreferences = [];
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
            const importer = new Importer(
                country,
                marketShares[i],
                preset.purchasingPower,
                preset.wineTradition
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

// Save importers to localStorage
export function saveImporters(importers) {
    localStorage.setItem('importers', JSON.stringify(importers));
}

// Load importers from localStorage
export function loadImporters() {
    const storedImporters = localStorage.getItem('importers');
    if (!storedImporters) {
        return null;
    }
    
    try {
        return JSON.parse(storedImporters);
    } catch (error) {
        console.error('Failed to parse importers from localStorage', error);
        return null;
    }
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
