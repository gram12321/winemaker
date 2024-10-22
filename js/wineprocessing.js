// wineprocessing.js
import { addConsoleMessage } from './console.js';
import { inventoryInstance, saveInventory } from './resource.js'; // Import saveInventory

export function grapeCrushing(selectedResource) {
    // Find the selected resource
    const resource = inventoryInstance.items.find(item => item.resource.name === selectedResource && item.state === 'Grapes');

    if (resource && resource.amount >= 1) {
        // Remove one unit from the resource
        inventoryInstance.removeResource(resource.resource.name, 1, resource.state, resource.vintage, resource.quality);

        // Add one unit of the "must" with the same attributes
        inventoryInstance.addResource(resource.resource.name, 1, 'Must', resource.vintage, resource.quality);

        // Save the updated inventory to localStorage
        saveInventory();

        addConsoleMessage(`One unit of ${selectedResource} has been crushed into must.`);
    } else {
        addConsoleMessage(`Unable to process ${selectedResource}. Make sure there is sufficient quantity.`);
    }
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