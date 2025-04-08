// src/lib/game/resource.ts
// Removed unused import
// import { getColorClass } from '@/lib/core/utils/formatUtils';
import { GrapeVariety } from '@/lib/core/constants/vineyardConstants';
import { GameDate } from '@/lib/core/constants/gameConstants';
import { WineBatch } from '@/gameState'; // Assuming WineBatch is defined here or imported

// Migrated from old resource.js
const grapeCharacteristics: Record<GrapeVariety, {
    acidity: number;
    aroma: number;
    body: number;
    spice: number;
    sweetness: number;
    tannins: number;
}> = {
    'Barbera': {
        acidity: 0.2,      // high acidity
        aroma: 0,          // neutral
        body: 0.1,         // moderately full body
        spice: 0,          // neutral
        sweetness: 0,      // neutral
        tannins: 0.1       // moderate tannins
    },
    'Chardonnay': {
        acidity: -0.1,     // moderate acidity
        aroma: 0.15,       // aromatic
        body: 0.25,        // medium body
        spice: 0.0,        // neutral
        sweetness: 0,      // neutral
        tannins: -0.15     // very low tannins
    },
    'Pinot Noir': {
        acidity: 0.15,     // moderately high acidity
        aroma: 0.1,        // aromatic
        body: -0.15,       // light body
        spice: 0,          // neutral
        sweetness: 0,      // neutral
        tannins: -0.1      // low tannins
    },
    'Primitivo': {
        acidity: 0,        // neutral
        aroma: 0.2,        // very aromatic
        body: 0.2,         // full bodied
        spice: 0,          // neutral
        sweetness: 0.2,    // naturally sweet
        tannins: 0.2       // high tannins
    },
    'Sauvignon Blanc': { // Fixed potential space issue from old code notes
        acidity: 0.3,
        aroma: 0.25,
        body: -0.2,
        spice: 0.1,
        sweetness: -0.1,
        tannins: -0.2
    },
    // Removed placeholder entries
};

// Migrated Resource class
export class Resource {
    name: GrapeVariety;
    naturalYield: number;
    fragile: number; // Robustness (0-1), lower is more fragile
    proneToOxidation: number; // Susceptibility (0-1), higher is more prone
    grapeColor: 'red' | 'white';
    wineCharacteristics: {
        acidity: number;
        aroma: number;
        body: number;
        spice: number;
        sweetness: number;
        tannins: number;
    };

    constructor(name: GrapeVariety, naturalYield: number, fragile: number, proneToOxidation: number, grapeColor: 'red' | 'white') {
        this.name = name;
        this.naturalYield = naturalYield;
        this.fragile = fragile;
        this.proneToOxidation = proneToOxidation;
        this.grapeColor = grapeColor;
        // Get base characteristics, providing a default empty object if not found
        this.wineCharacteristics = grapeCharacteristics[name] || { acidity: 0, aroma: 0, body: 0, spice: 0, sweetness: 0, tannins: 0 };
    }
}

// Migrated allResources array - Reverted to original 5
// Resource(name, naturalYield, fragile, proneToOxidation, grapeColor)
export const allResources: Resource[] = [
    new Resource('Barbera', 1, 1, 0.4, 'red'),
    new Resource('Chardonnay', 0.9, 1, 0.7, 'white'),
    new Resource('Pinot Noir', 0.7, 0.4, 0.8, 'red'),
    new Resource('Primitivo', 0.85, 0.8, 0.3, 'red'),
    new Resource('Sauvignon Blanc', 0.95, 0.9, 0.9, 'white'),
    // Removed placeholder entries
];

// Migrated getResourceByName function
export function getResourceByName(name: GrapeVariety | string): Resource | null {
    // Add type annotation for parameter 'r'
    const resource = allResources.find((r: Resource) => r.name === name);
    return resource || null;
}

// Note: InventoryItem and Inventory classes are not migrated here
// as they seem related to WineBatch management, which is handled differently now. 