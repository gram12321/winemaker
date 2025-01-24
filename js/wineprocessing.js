import { inventoryInstance } from './resource.js';
import { saveInventory } from './database/adminFunctions.js';
import { addConsoleMessage } from './console.js';
import taskManager, { TaskType } from './taskManager.js';

export function fermentation(selectedResource, storage, mustAmount) {
    // Check if there's any work progress
    const workProgress = taskManager.getTaskProgress('Fermentation');
    if (workProgress <= 0) {
        addConsoleMessage("No work has been done on fermentation yet");
        return false;
    }

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
    if (mustAmount <= 0) {
        return false; // Skip if no must to ferment
    }
    
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
