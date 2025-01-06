
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

    // Check storage capacity
    const currentInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
    const currentAmount = currentInventory
        .filter(item => item.storage === storage)
        .reduce((sum, item) => sum + item.amount, 0);

    const availableCapacity = tool.capacity - currentAmount;
    
    if (availableCapacity <= 0) {
        addConsoleMessage("No storage capacity available.");
        return false;
    }

    return true;
}
