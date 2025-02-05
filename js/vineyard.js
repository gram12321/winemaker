import { farmlandYield } from './farmland.js';
import { addConsoleMessage } from './console.js';
import { loadBuildings } from './database/adminFunctions.js';
import { inventoryInstance } from './resource.js';

// Export farmlandYield for use in other modules
export { farmlandYield };

/**
 * Checks if harvesting is possible for a given farmland and storage
 * @param {Object} farmland - The farmland object to harvest from
 * @param {string} selectedTool - The storage container identifier
 * @returns {boolean|Object} - Returns false if harvest not possible, or object with warning status
 */
export function canHarvest(farmland, selectedTool) {
    // First check if field is in first year "no yield" status
    if (farmland.status === 'No yield in first season') {
        addConsoleMessage("Field is in its first year and cannot be harvested yet.");
        return false;
    }

    const buildings = loadBuildings();

    // Find the tool in buildings
    const tool = buildings.flatMap(b => 
        b.slots.flatMap(slot => 
            slot.tools.find(t => `${t.name} #${t.instanceNumber}` === selectedTool)
        )
    ).find(t => t);

    if (!tool) {
        console.log('Tool not found:', selectedTool);
        return { warning: true, availableCapacity: 0 };
    }

    // Check if container has capacity
    const playerInventory = inventoryInstance.items;
    const currentAmount = playerInventory
        .filter(item => item.storage === selectedTool)
        .reduce((sum, item) => sum + item.amount, 0);

    const availableCapacity = tool.capacity - currentAmount;

    // Check for mixing different grapes
    const existingGrapes = playerInventory.find(item => 
        item.storage === selectedTool && 
        item.state === 'Grapes' &&
        (item.resource.name !== farmland.plantedResourceName || 
         parseInt(item.vintage) !== parseInt(localStorage.getItem('year')))
    );

    return {
        warning: existingGrapes !== undefined || availableCapacity <= 0,
        availableCapacity: availableCapacity > 0 ? availableCapacity : 0
    };
}
