import { inventoryInstance } from './resource.js';
import { saveInventory } from './database/adminFunctions.js';
import { addConsoleMessage } from './console.js';
import taskManager, { TaskType } from './taskManager.js';

export function fermentation(selectedResource, storage, mustAmount) {
    const resource = inventoryInstance.items.find(item => 
        item.resource.name === selectedResource && 
        item.state === 'Must' &&
        item.storage === storage
    );

    if (!resource || resource.amount < 1) {
        addConsoleMessage(`Unable to ferment ${selectedResource}. Ensure there is sufficient quantity of Must.`);
        return;
    }

    // Add fermentation as a progressive task
    taskManager.addProgressiveTask(
        'Fermentation',
        TaskType.winery,
        100, // totalWork for fermentation
        (target, progress, params) => {
            performFermentation(target, progress, params);
        },
        storage,
        { selectedResource, storage, mustAmount, vintage: resource.vintage, quality: resource.quality, fieldName: resource.fieldName, fieldPrestige: resource.fieldPrestige }
    );
}

export function performFermentation(target, progress, params) {
    const { selectedResource, storage, mustAmount, vintage, quality, fieldName, fieldPrestige } = params;
    const wineVolume = mustAmount * 0.9 * progress;
    const bottleAmount = Math.floor(wineVolume / 0.75);

    inventoryInstance.removeResource(
        { name: selectedResource },
        mustAmount,
        'Must',
        vintage,
        storage
    );

    inventoryInstance.addResource(
        { name: selectedResource, naturalYield: 1 },
        bottleAmount,
        'Bottles',
        vintage,
        quality,
        fieldName,
        fieldPrestige,
        'Wine Cellar'
    );

    saveInventory();
    addConsoleMessage(`${mustAmount} liters of ${selectedResource} must has been fermented into ${bottleAmount} bottles.`);
}
