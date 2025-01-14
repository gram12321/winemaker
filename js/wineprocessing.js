import { inventoryInstance } from './resource.js';
import { saveInventory } from './database/adminFunctions.js';
import { addConsoleMessage } from './console.js';

export function fermentMust(selectedResource, storage, mustAmount) {
    const resource = inventoryInstance.items.find(item => 
        item.resource.name === selectedResource && 
        item.state === 'Must' &&
        item.storage === storage
    );

    if (!resource || resource.amount < 1) {
        addConsoleMessage(`Unable to ferment ${selectedResource}. Ensure there is sufficient quantity of Must.`);
        return;
    }

    // Convert must to wine volume (10% loss during fermentation)
    const wineVolume = resource.amount * 0.9;
    // Convert wine volume to number of 0.75L bottles
    const bottleAmount = Math.floor(wineVolume / 0.75);

    // Remove units from the must resource
    inventoryInstance.removeResource(
        { name: resource.resource.name },
        resource.amount,
        'Must',
        resource.vintage,
        storage
    );

    // Add as bottles to Wine Cellar
    inventoryInstance.addResource(
        { name: resource.resource.name, naturalYield: 1 },
        bottleAmount,
        'Bottles',
        resource.vintage,
        resource.quality,
        resource.fieldName,
        resource.fieldPrestige,
        'Wine Cellar'
    );

    saveInventory();
    addConsoleMessage(`${resource.amount} liters of ${selectedResource} must has been fermented into ${bottleAmount} bottles.`);
}
