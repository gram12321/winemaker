import { inventoryInstance  } from './resource.js';
import { saveInventory } from './database/adminFunctions.js';
import { addConsoleMessage } from './console.js';

export function fermentMust(selectedResource, storage) {
    const resource = inventoryInstance.items.find(item => 
        item.resource.name === selectedResource && 
        item.state === 'Must' &&
        item.storage === storage
    );

    if (!resource || resource.amount < 1) {
        addConsoleMessage(`Unable to ferment ${selectedResource}. Ensure there is sufficient quantity of Must.`);
        return;
    }

    // Remove units from the must resource and add as bottles
    inventoryInstance.removeResource(
        resource.resource.name,
        resource.amount,
        'Must',
        resource.vintage,
        resource.quality,
        resource.fieldName,
        resource.fieldPrestige,
        storage
    );

    inventoryInstance.addResource(
        resource.resource.name,
        resource.amount,
        'Bottle',
        resource.vintage,
        resource.quality,
        resource.fieldName,
        resource.fieldPrestige,
        'Wine Cellar'  // Bottles go to wine cellar
    );

    saveInventory();
    addConsoleMessage(`${resource.amount} liters of ${selectedResource} has been fermented and bottled.`);
}
