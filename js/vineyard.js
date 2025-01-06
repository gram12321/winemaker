
import { farmlandYield } from './farmland.js';
import { addConsoleMessage } from './console.js';

export { farmlandYield };

export function canHarvest(farmland, storage) {
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
        return false;
    }

    // Get current inventory and expected yield
    const currentInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
    const expectedYield = farmlandYield(farmland);
    const existingItems = currentInventory.filter(item => item.storage === storage);
    const currentAmount = existingItems.reduce((sum, item) => sum + item.amount, 0);

    // Check if container has existing content
    if (existingItems.length > 0) {
        const firstItem = existingItems[0];
        if (firstItem.fieldName !== farmland.name ||
            firstItem.resource.name !== farmland.plantedResourceName ||
            firstItem.vintage !== new Date().getFullYear()) {
            addConsoleMessage("Container already contains different content. Please select another container.");
            return false;
        }
    }

    // Check if container has enough capacity for the expected yield
    const availableCapacity = tool.capacity - currentAmount;
    if (availableCapacity < expectedYield) {
        return { warning: true, availableCapacity };
    }

    return { warning: false };
}
