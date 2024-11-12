import { inventoryInstance, displayInventory } from './resource.js'; // Import needed functions
import { normalizeLandValue } from './names.js'; // Ensure you import normalizeLandValue
import { addConsoleMessage } from './console.js';
import { addTransaction } from './finance.js';
import { applyPrestigeHit } from './database/loadSidebar.js';
import { saveInventory } from './database/adminFunctions.js';

// Modify sellWines function to use landValue from Farmland
export function sellWines(resourceName) {
    const resourceIndex = inventoryInstance.items.findIndex(item => item.resource.name === resourceName && item.state === 'Bottle');

    if (resourceIndex !== -1) {
        const resource = inventoryInstance.items[resourceIndex];

        if (resource.amount > 0) {
            resource.amount -= 1; // Reduce the inventory by 1

            // Obtain the corresponding farmland using the field name
            const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];

            // Match the resource field name against the correct property in farmland
            const farmland = farmlands.find(field => field.name === resource.fieldName);

            const landValue = farmland.landvalue;

            const sellingPrice = calculateWinePrice(resource.quality, landValue, resource.fieldPrestige);

            // Add console message to notify user of the sale
            addConsoleMessage(`Sold 1 bottle of ${resource.resource.name}, Vintage ${resource.vintage}, Quality ${resource.quality.toFixed(2)} for €${sellingPrice.toFixed(2)}.`);

            // Log the sale transaction and update the balance
            addTransaction('Income', 'Wine Sale', sellingPrice);

            // Optionally handle prestige effects if used
            const prestigeHit = sellingPrice / 1000;
            applyPrestigeHit(prestigeHit);

            if (resource.amount === 0) {
                // Optionally remove the item if the amount reaches zero
                inventoryInstance.items.splice(resourceIndex, 1);
            }

            saveInventory(); // Save the inventory updates

            // Optionally, refresh the inventory display if your UI supports it
            displayInventory(inventoryInstance, ['winecellar-table-body'], true);
        }
    }
}


// New function to calculate wine price using average moderation
export function calculateWinePrice(quality, landValue, fieldPrestige) {
    const baseValue = 1; // Base value in Euros
    const normalizedLandValue = normalizeLandValue(landValue); // Normalize the land value to 0-1

    // Log the starting parameters and normalized land value
    console.log(`Calculating Wine Price:`);
    console.log(`Quality: ${quality}`);
    console.log(`Land Value: ${landValue}, Normalized Land Value: ${normalizedLandValue.toFixed(2)}`);
    console.log(`Field Prestige: ${fieldPrestige}`);

    // Calculate the average of quality, normalized land value, and field prestige
    let wineValueModifier = (quality * 100 + normalizedLandValue * 100 + fieldPrestige * 100) / 3;

    // Log the wine value modifier after including prestige
    console.log(`Wine Value Modifier: ${wineValueModifier.toFixed(2)}`);

    // Calculate and log the final wine price
    const finalPrice = baseValue * wineValueModifier;
    console.log(`Final Wine Price: €${finalPrice.toFixed(2)}`);

    return finalPrice;
}