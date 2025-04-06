import { addConsoleMessage } from '../console.js';

const HARVEST_OXIDATION_RATE = 0.02; // 2% base oxidation per week during harvest

export function applyHarvestOxidation(inventoryItem) {


    // Calculate oxidation increment based on grape's properties
    const oxidationIncrement = HARVEST_OXIDATION_RATE * inventoryItem.resource.proneToOxidation;
    const previousOxidation = inventoryItem.oxidation || 0;
    
    // Apply oxidation
    inventoryItem.oxidation = Math.min(1, previousOxidation + oxidationIncrement);



    // Add console message if significant oxidation occurs
    if (oxidationIncrement > 0.01) {
        addConsoleMessage(`${inventoryItem.resource.name} from ${inventoryItem.fieldName} oxidized by ${(oxidationIncrement * 100).toFixed(1)}%`);
    }
}
