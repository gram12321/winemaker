
import { farmlandYield } from './farmland.js';
import { addConsoleMessage } from './console.js';

export { farmlandYield };

export function canHarvest(farmlandId) {
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const farmland = farmlands.find(f => f.id === parseInt(farmlandId));
    
    if (!farmland) {
        addConsoleMessage('Invalid farmland selected');
        return false;
    }

    if (!farmland.plantedResourceName || farmland.ripeness < 0.10) {
        addConsoleMessage('Field is not ready for harvest');
        return false;
    }

    return true;
}
