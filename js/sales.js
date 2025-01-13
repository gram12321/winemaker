import { normalizeLandValue } from './names.js';
import { addConsoleMessage } from './console.js';
import { addTransaction } from './finance.js';
import { applyPrestigeHit } from './database/loadSidebar.js';
import { loadWineOrders, removeWineOrder, addWineOrder } from './database/adminFunctions.js';
import { inventoryInstance } from './resource.js';

export function sellWines(resourceName) {
    const bottledWine = inventoryInstance.getItemsByState('Bottles').find(item => item.resource.name === resourceName);

    if (bottledWine && bottledWine.amount > 0) {
        const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
        const farmland = farmlands.find(field => field.name === bottledWine.fieldName);

        if (!farmland) {
            addConsoleMessage('Error: Could not find farmland data.');
            return;
        }

        const sellingPrice = calculateWinePrice(bottledWine.quality, bottledWine);

        if (inventoryInstance.removeResource(
            { name: resourceName }, 
            1, 
            'Bottles', 
            bottledWine.vintage, 
            bottledWine.storage
        )) {
            addConsoleMessage(
                `Sold 1 bottle of ${bottledWine.resource.name}, ` +
                `Vintage ${bottledWine.vintage}, ` +
                `Quality ${(bottledWine.quality * 100).toFixed(0)}% ` +
                `for €${sellingPrice.toFixed(2)}.`
            );

            addTransaction('Income', 'Wine Sale', sellingPrice);
            applyPrestigeHit(sellingPrice / 1000);
            inventoryInstance.save();
        }
    }
}

export function calculateWinePrice(quality, wine) {
    const baseValue = 1;
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const farmland = farmlands.find(field => field.name === wine.fieldName);

    if (!farmland) return 0;

    const normalizedLandValue = normalizeLandValue(farmland.landvalue);
    const wineValueModifier = (quality * 100 + normalizedLandValue * 100 + wine.fieldPrestige * 100) / 3;
    return baseValue * wineValueModifier;
}

export function generateWineOrder() {
    const bottledWines = inventoryInstance.items.filter(item => item.state === 'Bottles');

    if (bottledWines.length === 0) {
        addConsoleMessage("A customer wants to buy wine, but there are no bottles in the wine cellar.");
        return;
    }

    const orderTypes = {
        "Private Order": { amountMultiplier: 1, priceMultiplier: 1 },
        "Engross Order": { amountMultiplier: 10, priceMultiplier: 0.85 }
    };

    const selectedWine = bottledWines[Math.floor(Math.random() * bottledWines.length)];
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const farmland = farmlands.find(field => field.name === selectedWine.fieldName);

    if (!farmland) {
        addConsoleMessage('Error: Could not generate wine order due to missing farmland data.');
        return;
    }

    const orderTypeKeys = Object.keys(orderTypes);
    const selectedOrderTypeKey = orderTypeKeys[Math.floor(Math.random() * orderTypeKeys.length)];
    const selectedOrderType = orderTypes[selectedOrderTypeKey];

    const baseAmount = Math.round((0.5 + Math.random() * 1.5) * (1 + 2 * selectedWine.fieldPrestige));
    const basePrice = (0.5 + Math.random() * 1.5) * calculateWinePrice(
        selectedWine.quality,
        selectedWine
    );

    const newOrder = {
        type: selectedOrderTypeKey,
        resourceName: selectedWine.resource.name,
        fieldName: selectedWine.fieldName,
        vintage: selectedWine.vintage,
        quality: selectedWine.quality,
        amount: baseAmount * selectedOrderType.amountMultiplier,
        wineOrderPrice: basePrice * selectedOrderType.priceMultiplier
    };

    addWineOrder(newOrder);
    addConsoleMessage(
        `Created ${newOrder.type} for ${newOrder.amount} bottles of ` +
        `${newOrder.resourceName}, Vintage ${newOrder.vintage}, ` +
        `Quality ${(newOrder.quality * 100).toFixed(0)}%, ` +
        `Price €${newOrder.wineOrderPrice.toFixed(2)}.`
    );
}

export function sellOrderWine(orderIndex) {
    const wineOrders = loadWineOrders();
    const order = wineOrders[orderIndex];

    if (order) {
        const bottledWine = inventoryInstance.items.find(item =>
            item.resource.name === order.resourceName &&
            item.state === 'Bottles' &&
            item.vintage === order.vintage &&
            item.quality === order.quality
        );

        if (bottledWine && bottledWine.amount >= order.amount) {
            const totalSellingPrice = order.wineOrderPrice * order.amount;

            if (inventoryInstance.removeResource(
                bottledWine.resource, 
                order.amount, 
                'Bottles', 
                bottledWine.vintage, 
                bottledWine.storage
            )) {
                addConsoleMessage(
                    `Sold ${order.amount} bottles of ${order.resourceName}, ` +
                    `Vintage ${order.vintage}, ` +
                    `Quality ${(order.quality * 100).toFixed(0)}% ` +
                    `for €${totalSellingPrice.toFixed(2)}.`
                );

                addTransaction('Income', 'Wine Sale', totalSellingPrice);
                applyPrestigeHit(totalSellingPrice / 1000);
                removeWineOrder(orderIndex);
                inventoryInstance.save();
                displayWineCellarInventory();
                return true;
            }
        } else {
            addConsoleMessage('Insufficient inventory to complete this order.');
        }
    } else {
        addConsoleMessage('Invalid wine order index.');
    }
    return false;
}

export function shouldGenerateWineOrder() {
    const companyPrestige = parseFloat(localStorage.getItem('companyPrestige')) || 0;
    let chance;

    if (companyPrestige <= 100) {
        chance = 0.2 + (companyPrestige / 100) * (0.5 - 0.2);
    } else {
        chance = 0.5 + (Math.atan((companyPrestige - 100) / 200) / Math.PI) * (0.99 - 0.5);
    }

    return Math.random() < Math.min(chance, 0.99);
}