
import { farmlandYield } from './farmland.js';
import { inventoryInstance } from './resource.js';
import { addConsoleMessage } from './console.js';
import { formatNumber } from './utils.js';
import { saveInventory } from './database/adminFunctions.js';

export { farmlandYield };

export function harvest(farmland, storage) {
    const gameYear = parseInt(localStorage.getItem('year'), 10);
    const buildings = JSON.parse(localStorage.getItem('buildings')) || [];
    
    // Find the storage tool
    const buildingWithTool = buildings.find(building => 
        building.contents.some(content => `${content.name} #${content.instanceNumber}` === storage)
    );
    const tool = buildingWithTool?.contents.find(content => 
        `${content.name} #${content.instanceNumber}` === storage
    );

    if (!tool) {
        addConsoleMessage("No valid storage container found.");
        return 0;
    }

    // Calculate harvest amount based on field yield
    const harvestYield = farmlandYield(farmland);
    const totalHarvest = harvestYield * farmland.acres;

    // Check storage capacity
    const currentInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
    const currentAmount = currentInventory
        .filter(item => item.storage === storage)
        .reduce((sum, item) => sum + item.amount, 0);

    const availableCapacity = tool.capacity - currentAmount;
    const harvestAmount = Math.min(totalHarvest, availableCapacity);

    if (harvestAmount <= 0) {
        addConsoleMessage("No storage capacity available.");
        return 0;
    }

    // Calculate quality (simplified)
    const quality = ((field.annualQualityFactor + field.ripeness) / 2).toFixed(2);

    // Add harvested grapes to inventory
    inventoryInstance.addResource(
        farmland.plantedResourceName,
        harvestAmount,
        'Grapes',
        gameYear,
        quality,
        farmland.name,
        farmland.farmlandPrestige,
        storage
    );

    // Update field status
    farmland.status = 'Harvested';
    farmland.ripeness = 0;
    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
    saveInventory();

    addConsoleMessage(`Harvested ${formatNumber(harvestAmount)} kg of ${farmland.plantedResourceName} with quality ${quality} from ${farmland.name}`);
    return harvestAmount;
}
