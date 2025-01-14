import { farmlandYield } from './farmland.js';
import { addConsoleMessage } from './console.js';
import { loadBuildings } from './database/adminFunctions.js';
import { inventoryInstance } from './resource.js';

// Export farmlandYield for use in other modules
export { farmlandYield };

/**
 * Checks if harvesting is possible for a given farmland and storage
 * @param {Object} farmland - The farmland object to harvest from
 * @param {string} storage - The storage container identifier
 * @returns {boolean|Object} - Returns false if harvest not possible, or object with warning status
 */
export function canHarvest(farmland, storage) {
    // First check if field is in first year "no yield" status
    if (farmland.status === 'No yield in first season') {
        addConsoleMessage("Field is in its first year and cannot be harvested yet.");
        return false;
    }

    const buildings = loadBuildings();

    // Find the building and tool that matches the storage identifier
    const buildingWithTool = buildings.find(building => 
        building.tools?.some(tool => `${tool.name} #${tool.instanceNumber}` === storage)
    );
    const tool = buildingWithTool?.tools.find(tool => 
        `${tool.name} #${tool.instanceNumber}` === storage
    );

    // Validate storage container exists
    if (!tool) {
        addConsoleMessage("No valid storage container found.");
        return false;
    }

    // Check if container supports grape storage
    if (!tool.supportedResources.includes('Grapes')) {
        addConsoleMessage("This container cannot store grapes.");
        return false;
    }

    // Get current inventory and calculate expected yield
    const currentInventory = inventoryInstance.items;
    const expectedYield = farmlandYield(farmland);
    const existingItems = currentInventory.filter(item => item.storage === storage);
    const currentAmount = existingItems.reduce((sum, item) => sum + item.amount, 0);

    // Check if container already has different content
    if (existingItems.length > 0) {
        const firstItem = existingItems[0];
        if (firstItem.fieldName !== farmland.name ||
            firstItem.resource.name !== farmland.plantedResourceName ||
            firstItem.vintage !== parseInt(localStorage.getItem('year'), 10)) {
            addConsoleMessage("Container already contains different content.");
            return false;
        }
    }

    // Check available capacity
    const availableCapacity = tool.capacity - currentAmount;
    if (availableCapacity < expectedYield) {
        return { warning: true, availableCapacity };
    }

    return { warning: false, availableCapacity };
}
