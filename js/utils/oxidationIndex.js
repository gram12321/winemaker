import { addConsoleMessage } from '../console.js';

const HARVEST_OXIDATION_RATE = 0.02; // 2% base oxidation per week during harvest

export function applyHarvestOxidation(inventoryItem) {
    if (!inventoryItem || !inventoryItem.resource) {
        console.warn('Invalid inventory item passed to applyHarvestOxidation');
        return;
    }

    // Calculate oxidation increment based on grape's properties
    const oxidationIncrement = HARVEST_OXIDATION_RATE * inventoryItem.resource.proneToOxidation;
    const previousOxidation = inventoryItem.oxidation || 0;
    
    // Apply oxidation
    inventoryItem.oxidation = Math.min(1, previousOxidation + oxidationIncrement);

    // Log the oxidation change
    console.log(`Oxidation change for ${inventoryItem.resource.name}:`, {
        previous: previousOxidation,
        increment: oxidationIncrement,
        new: inventoryItem.oxidation
    });

    // Add console message if significant oxidation occurs
    if (oxidationIncrement > 0.01) {
        addConsoleMessage(`${inventoryItem.resource.name} from ${inventoryItem.fieldName} oxidized by ${(oxidationIncrement * 100).toFixed(1)}%`);
    }

    // Quality impact could be calculated here if needed
}
