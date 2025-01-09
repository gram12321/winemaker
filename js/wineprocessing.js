
import { inventoryInstance } from './resource.js';
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

    // Remove units from the must resource
    inventoryInstance.removeResource(
        { name: selectedResource },
        resource.amount,
        'Must',
        resource.vintage,
        storage
    );

    // Add as bottles to Wine Cellar
    inventoryInstance.addResource(
        resource.resource.name,
        resource.amount,
        'Bottle',
        resource.vintage,
        resource.quality,
        resource.fieldName,
        resource.fieldPrestige,
        'Wine Cellar'
    );

    saveInventory();
    addConsoleMessage(`${resource.amount} liters of ${selectedResource} has been fermented and bottled.`);
}
