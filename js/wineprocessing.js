import { inventoryInstance } from './resource.js';
import { saveInventory } from './database/adminFunctions.js';
import { addConsoleMessage } from './console.js';
import taskManager from './taskManager.js';
import { formatNumber } from './utils.js';
import { calculateFermentationWorkData } from './overlays/fermentationOverlay.js';

export function fermentation(selectedResource, storage, mustAmount, params = {}) {
    // Check for existing fermentation tasks
    const existingTasks = taskManager.getAllTasks().filter(task => 
        task.name === 'Fermentation' && 
        task.target === storage
    );

    if (existingTasks.length > 0) {
        addConsoleMessage("A fermentation task is already in progress for this must");
        return false;
    }

    // Create fermentation task
    const workData = calculateFermentationWorkData(mustAmount, params.selectedMethod);
    
    taskManager.addProgressiveTask(
        'Fermentation',
        'winery',
        workData.totalWork,
        performFermentation,
        storage,
        {
            selectedResource,
            storage,
            mustAmount,
            ...params
        }
    );

    addConsoleMessage(`Started fermentation of ${formatNumber(mustAmount)}L of ${selectedResource} must from ${params.fieldName}`);
    return true;
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
    addConsoleMessage(`${formatNumber(mustAmount)} liters of ${selectedResource} must has been fermented into ${formatNumber(bottleAmount)} bottles.`);
}
