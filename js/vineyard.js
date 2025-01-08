import { farmlandYield } from './farmland.js';
import { addConsoleMessage } from './console.js';

export { farmlandYield };

export function canHarvest(farmland, storage) {
    const buildings = JSON.parse(localStorage.getItem('buildings')) || [];

    // Find the storage tool
    const buildingWithTool = buildings.find(building => 
        building.tools?.some(tool => `${tool.name} #${tool.instanceNumber}` === storage)
    );
    const tool = buildingWithTool?.tools.find(tool => 
        `${tool.name} #${tool.instanceNumber}` === storage
    );

    if (!tool) {
        addConsoleMessage("No valid storage container found.");
        return false;
    }

    if (!tool.supportedResources.includes('Grapes')) {
        addConsoleMessage("This container cannot store grapes.");
        return false;
    }

    const currentInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
    const expectedYield = farmlandYield(farmland);
    const existingItems = currentInventory.filter(item => item.storage === storage);
    const currentAmount = existingItems.reduce((sum, item) => sum + item.amount, 0);

    // Check if container has existing content of different type
    if (existingItems.length > 0) {
        const firstItem = existingItems[0];
        if (firstItem.fieldName !== farmland.name ||
            firstItem.resource.name !== farmland.plantedResourceName ||
            firstItem.vintage !== parseInt(localStorage.getItem('year'), 10)) {
            addConsoleMessage("Container already contains different content.");
            return false;
        }
    }

    // Check container capacity
    const availableCapacity = tool.capacity - currentAmount;
    if (availableCapacity < expectedYield) {
        return { warning: true, availableCapacity };
    }

    return { warning: false };
}

