import { inventoryInstance } from './resource.js';
import { saveInventory } from './database/adminFunctions.js';
import { addConsoleMessage } from './console.js';
import taskManager, { TaskType } from './taskManager.js';

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

    // Add fermentation as a completion task
    taskManager.addCompletionTask(
        'Fermentation',
        TaskType.winery,
        4, // 4 weeks for fermentation
        (target, params) => {
            const { selectedResource, storage, mustAmount } = params;
            const wineVolume = mustAmount * 0.9;
            const bottleAmount = Math.floor(wineVolume / 0.75);

            inventoryInstance.removeResource(
                { name: selectedResource },
                mustAmount,
                'Must',
                resource.vintage,
                storage
            );

            inventoryInstance.addResource(
                { name: selectedResource, naturalYield: 1 },
                bottleAmount,
                'Bottles',
                resource.vintage,
                resource.quality,
                resource.fieldName,
                resource.fieldPrestige,
                'Wine Cellar'
            );

            saveInventory();
            addConsoleMessage(`${mustAmount} liters of ${selectedResource} must has been fermented into ${bottleAmount} bottles.`);
        },
        storage,
        { selectedResource, storage, mustAmount }
    );
}
