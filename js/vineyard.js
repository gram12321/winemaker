
import { farmlandYield } from './farmland.js';
import { addConsoleMessage } from './console.js';
import { formatNumber } from './utils.js';
import { saveInventory } from './database/adminFunctions.js';

export { farmlandYield };

export function harvest(farmlandId, selectedStorage) {
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const farmland = farmlands.find(f => f.id === parseInt(farmlandId));
    const playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];
    
    if (!farmland) {
        addConsoleMessage('Invalid farmland selected');
        return false;
    }

    let harvestedAmount = farmlandYield(farmland);
    if (harvestedAmount === undefined) harvestedAmount = 0;

    // Calculate quality based on annual quality factor and ripeness
    const quality = ((farmland.annualQualityFactor + farmland.ripeness) / 2).toFixed(2);

    const containerInventory = playerInventory.find(item => item.storage === selectedStorage);

    if (containerInventory) {
        containerInventory.amount += harvestedAmount;
        containerInventory.quality = parseFloat(quality);
    } else {
        playerInventory.push({
            resource: { name: farmland.plantedResourceName },
            amount: harvestedAmount,
            storage: selectedStorage,
            fieldName: farmland.name,
            vintage: localStorage.getItem('year'),
            quality: parseFloat(quality),
            state: 'Grapes'
        });
    }

    // Update farmland
    farmland.ripeness = 0;
    
    // Save updates
    localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
    localStorage.setItem('ownedFarmlands', JSON.stringify(farmlands));
    saveInventory();

    addConsoleMessage(`Harvested ${harvestedAmount.toFixed(2)} kg from ${farmland.name}`);
    return true;
}
