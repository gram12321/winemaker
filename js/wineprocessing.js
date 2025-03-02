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
    if (mustAmount <= 0) return false;
    
    const wineVolume = mustAmount * 0.9 * progress;
    const bottleAmount = Math.floor(wineVolume / 0.75);

    // Find the must item to copy its properties
    const mustItem = inventoryInstance.items.find(item => 
        item.storage === storage &&
        item.state === 'Must' &&
        item.resource.name === selectedResource &&
        item.vintage === vintage
    );

    if (!mustItem) {
        addConsoleMessage("Error: Source must not found");
        return false;
    }

    // Copy all properties needed for wine characteristics
    const wineProperties = {
        // Base characteristics
        acidity: mustItem.acidity,
        aroma: mustItem.aroma,
        body: mustItem.body,
        spice: mustItem.spice,
        sweetness: mustItem.sweetness,
        tannins: mustItem.tannins,
        
        // Required properties for archetypes
        oxidation: mustItem.oxidation || 0,
        ripeness: mustItem.ripeness || 0,
        crushingMethod: mustItem.crushingMethod,
        fieldSource: mustItem.fieldSource,
        specialFeatures: mustItem.specialFeatures || []
    };

    // Remove the must
    inventoryInstance.removeResource(
        { name: selectedResource },
        mustAmount,
        'Must',
        vintage,
        storage
    );

    // Add the wine with all properties
    const newWine = inventoryInstance.addResource(
        { 
            name: selectedResource, 
            naturalYield: 1,
            grapeColor: mustItem.resource.grapeColor
        },
        bottleAmount,
        'Bottles',
        vintage,
        quality,
        fieldName,
        fieldPrestige,
        'Wine Cellar',
        wineProperties.oxidation,
        wineProperties.ripeness
    );

    // Apply all properties to the new wine
    if (newWine) {
        Object.assign(newWine, wineProperties);
        
        // Make sure special features are properly transferred
        if (wineProperties.specialFeatures) {
            wineProperties.specialFeatures.forEach(feature => {
                newWine.addSpecialFeature(feature);
            });
        }
    }

    saveInventory();
    addConsoleMessage(`${formatNumber(mustAmount)} liters of ${selectedResource} must has been fermented into ${formatNumber(bottleAmount)} bottles.`);
}
