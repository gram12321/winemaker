// wineprocessing.js
import { addConsoleMessage } from './console.js';
import { inventoryInstance } from './resource.js'; // Import saveInventory
import { saveInventory } from './database/adminFunctions.js'; // Import saveInventory

export function grapeCrushing(selectedResource) {
    const incrementAmount = 10; // Standard increment amount
    const resource = inventoryInstance.items.find(item => item.resource.name === selectedResource && item.state === 'Grapes');
    const iconPath = '/assets/icon/icon_pressing.webp'; // Use the verified absolute path

    if (resource) {
        // Calculate the actual processing amount based on availability
        const actualIncrement = Math.min(incrementAmount, resource.amount);

        if (actualIncrement > 0) {
            // Remove the actual increment amount from the resource
            inventoryInstance.removeResource(resource.resource.name, actualIncrement, resource.state, resource.vintage, resource.quality);

            // Add the equivalent amount of "must"
            inventoryInstance.addResource(resource.resource.name, actualIncrement, 'Must', resource.vintage, resource.quality);

            // Save the updated inventory to localStorage
            saveInventory();

            addConsoleMessage(`${actualIncrement} units of <strong>${selectedResource}, ${resource.vintage},</strong> ${resource.quality} have been crushed into must.`);
            return actualIncrement; // Return the amount of work processed
        } else {
            addConsoleMessage(`No units of ${selectedResource} available to process.`);
        }
    } else {
        addConsoleMessage(`Unable to process ${selectedResource}. Ensure it is available.`);
    }

    return 0; // Return zero if no processing was done
}

export function fermentMust(selectedResource) {
    // Find the selected must resource
    const resource = inventoryInstance.items.find(item => item.resource.name === selectedResource && item.state === 'Must');
    if (resource && resource.amount >= 1) {
        // Remove one unit from the must resource
        inventoryInstance.removeResource(resource.resource.name, 1, 'Must', resource.vintage, resource.quality);
        // Add one unit of the "Bottle" with the same attributes
        inventoryInstance.addResource(resource.resource.name, 1, 'Bottle', resource.vintage, resource.quality);
        // Save the updated inventory to localStorage
        saveInventory();
        addConsoleMessage(`One unit of ${selectedResource} has been fermented into a bottle.`);
    } else {
        addConsoleMessage(`Unable to ferment ${selectedResource}. Ensure there is sufficient quantity of Must.`);
    }
}