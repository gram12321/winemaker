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

function harvest(farmland, farmlandId, selectedTool, availableCapacity = null) {
  const harvestCheck = canHarvest(farmland, selectedTool);
  if ((!harvestCheck || harvestCheck.warning) && !availableCapacity) {
    return false;
  }

  const buildings = JSON.parse(localStorage.getItem('buildings')) || [];
  const tool = buildings.flatMap(b => b.contents).find(t => 
    `${t.name} #${t.instanceNumber}` === selectedTool
  );
  
  if (!tool) {
    addConsoleMessage("Storage container not found");
    return false;
  }

  const gameYear = parseInt(localStorage.getItem('year'), 10);
  const harvestYield = farmlandYield(farmland);
  const currentInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
  const currentAmount = currentInventory
    .filter(item => item.storage === selectedTool)
    .reduce((sum, item) => sum + item.amount, 0);
  
  const remainingCapacity = tool.capacity - currentAmount;
  const totalHarvest = Math.min(harvestYield, remainingCapacity);
}