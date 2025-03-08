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

    // Find the must item to ensure we have all necessary data
    const mustItem = inventoryInstance.items.find(item => 
        item.storage === storage &&
        item.state === 'Must' &&
        item.resource.name === selectedResource
    );

    if (mustItem) {
        // Ensure we pass field prestige from the must item if not provided in params
        if (!params.fieldPrestige && mustItem.fieldPrestige) {
            params.fieldPrestige = mustItem.fieldPrestige;
        }
        
        // Ensure we pass country and region data
        params.country = mustItem.country;
        params.region = mustItem.region;
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
    const { selectedResource, storage, mustAmount, vintage, quality, fieldName, fieldPrestige, country, region } = params;
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

    // Create clean base properties object with proper number types
    const baseProperties = {
        // Wine characteristics - ensure all are numbers
        acidity: parseFloat(mustItem.acidity) || 0,
        aroma: parseFloat(mustItem.aroma) || 0,
        body: parseFloat(mustItem.body) || 0,
        spice: parseFloat(mustItem.spice) || 0,
        sweetness: parseFloat(mustItem.sweetness) || 0,
        tannins: parseFloat(mustItem.tannins) || 0,
        
        // Required properties for archetypes
        oxidation: parseFloat(mustItem.oxidation) || 0,
        ripeness: parseFloat(mustItem.ripeness) || 0,
        crushingMethod: mustItem.crushingMethod || 'Standard',
        fieldSource: mustItem.fieldSource || {
            conventional: 'Traditional',
            altitude: null,
            soil: null,
            terrain: null
        },
        specialFeatures: mustItem.specialFeatures || [],
        
        // Essential region data
        country: mustItem.country,
        region: mustItem.region
    };

    // Remove the must
    inventoryInstance.removeResource(
        { name: selectedResource },
        mustAmount,
        'Must',
        vintage,
        storage
    );

    // Prepare wine object for balance calculation
    const wineForBalanceCalc = {
        ...baseProperties,
        resource: {
            name: selectedResource,
            grapeColor: mustItem.resource.grapeColor
        },
        quality: quality,
        fieldPrestige: fieldPrestige || mustItem.fieldPrestige || 0.1,
        vintage: vintage
    };

    // Calculate balance using the utility function
    const { calculateWineBalance } = require('./utils/balanceCalculator.js');
    const balanceInfo = calculateWineBalance(wineForBalanceCalc);

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
        fieldPrestige || mustItem.fieldPrestige || 0.1,
        'Wine Cellar',
        baseProperties.oxidation,
        baseProperties.ripeness,
        baseProperties.specialFeatures,
        balanceInfo.score // Pass balance score as the last parameter
    );

    // Apply all properties to the new wine
    if (newWine) {
        // Copy wine characteristics
        ['sweetness', 'acidity', 'tannins', 'body', 'spice', 'aroma'].forEach(char => {
            newWine[char] = baseProperties[char];
        });
        
        // Copy processing information
        newWine.crushingMethod = baseProperties.crushingMethod;
        newWine.fieldSource = baseProperties.fieldSource;
        
        // Copy special features
        baseProperties.specialFeatures.forEach(feature => {
            newWine.addSpecialFeature(feature);
        });
        
        newWine.country = baseProperties.country;
        newWine.region = baseProperties.region;
    }

    saveInventory();
    addConsoleMessage(`${formatNumber(mustAmount)} liters of ${selectedResource} must has been fermented into ${formatNumber(bottleAmount)} bottles with balance ${(balanceInfo.score * 100).toFixed(1)}%.`);
}
