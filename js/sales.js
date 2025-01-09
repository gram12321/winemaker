
import { normalizeLandValue } from './names.js';
import { addConsoleMessage } from './console.js';
import { addTransaction } from './finance.js';
import { applyPrestigeHit } from './database/loadSidebar.js';
import { loadWineOrders, saveWineOrders } from './database/adminFunctions.js';
import { inventoryInstance } from './resource.js';

export function sellWines(resourceName) {
    // Find bottled wine of the specified resource
    const bottledWine = inventoryInstance.items.find(item => 
        item.resource.name === resourceName && 
        item.state === 'Bottles'
    );

    if (bottledWine && bottledWine.amount > 0) {
        // Get farmland data for price calculation
        const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
        const farmland = farmlands.find(field => field.name === bottledWine.fieldName);

        if (!farmland) {
            addConsoleMessage('Error: Could not find farmland data.');
            return;
        }

        // Calculate selling price based on quality, land value and prestige
        const sellingPrice = calculateWinePrice(
            bottledWine.quality, 
            farmland.landvalue, 
            bottledWine.fieldPrestige
        );

        // Remove one bottle from inventory and process the sale
        if (inventoryInstance.removeResource(
            bottledWine.resource, 
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

            // Record transaction and update company prestige
            addTransaction('Income', 'Wine Sale', sellingPrice);
            applyPrestigeHit(sellingPrice / 1000);

            inventoryInstance.save();
        }
    }
}

export function calculateWinePrice(quality, landValue, fieldPrestige) {
    // Base value for wine pricing
    const baseValue = 1;
    
    // Normalize land value to 0-1 scale
    const normalizedLandValue = normalizeLandValue(landValue);
    
    // Calculate wine value based on quality, land value, and field prestige
    const wineValueModifier = (quality * 100 + normalizedLandValue * 100 + fieldPrestige * 100) / 3;
    return baseValue * wineValueModifier;
}

export function generateWineOrder() {
    const wineOrders = loadWineOrders();
    const bottledWines = inventoryInstance.items.filter(item => item.state === 'Bottles');

    // Check if there are any bottles available
    if (bottledWines.length === 0) {
        addConsoleMessage("A customer wants to buy wine, but there are no bottles in the wine cellar.");
        return;
    }

    // Define order types with their multipliers
    const orderTypes = {
        "Private Order": { amountMultiplier: 1, priceMultiplier: 1 },
        "Engross Order": { amountMultiplier: 10, priceMultiplier: 0.85 } // Bulk orders get 15% discount
    };

    // Select a random wine from available inventory
    const selectedWine = bottledWines[Math.floor(Math.random() * bottledWines.length)];
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const farmland = farmlands.find(field => field.name === selectedWine.fieldName);

    if (!farmland) {
        addConsoleMessage('Error: Could not generate wine order due to missing farmland data.');
        return;
    }

    // Randomly select order type
    const orderTypeKeys = Object.keys(orderTypes);
    const selectedOrderTypeKey = orderTypeKeys[Math.floor(Math.random() * orderTypeKeys.length)];
    const selectedOrderType = orderTypes[selectedOrderTypeKey];

    // Calculate base amount and price with randomization
    const baseAmount = Math.round((0.5 + Math.random() * 1.5) * (1 + 2 * selectedWine.fieldPrestige));
    const basePrice = (0.5 + Math.random() * 1.5) * calculateWinePrice(
        selectedWine.quality, 
        farmland.landvalue, 
        selectedWine.fieldPrestige
    );

    // Create the new order with adjusted amounts and prices
    const newOrder = {
        type: selectedOrderTypeKey,
        resourceName: selectedWine.resource.name,
        fieldName: selectedWine.fieldName,
        vintage: selectedWine.vintage,
        quality: selectedWine.quality,
        amount: baseAmount * selectedOrderType.amountMultiplier,
        wineOrderPrice: basePrice * selectedOrderType.priceMultiplier
    };

    wineOrders.push(newOrder);

    addConsoleMessage(
        `Created ${newOrder.type} for ${newOrder.amount} bottles of ` +
        `${newOrder.resourceName}, Vintage ${newOrder.vintage}, ` +
        `Quality ${(newOrder.quality * 100).toFixed(0)}%, ` +
        `Price €${newOrder.wineOrderPrice.toFixed(2)}.`
    );

    saveWineOrders(wineOrders);
}

export function sellOrderWine(orderIndex) {
    const wineOrders = loadWineOrders();

    if (orderIndex >= 0 && orderIndex < wineOrders.length) {
        const order = wineOrders[orderIndex];
        // Find matching wine in inventory
        const bottledWine = inventoryInstance.items.find(item =>
            item.resource.name === order.resourceName &&
            item.state === 'Bottles' &&
            item.vintage === order.vintage &&
            item.quality === order.quality
        );

        if (bottledWine && bottledWine.amount >= order.amount) {
            const totalSellingPrice = order.wineOrderPrice * order.amount;

            // Process the sale if inventory is sufficient
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

                // Record transaction and update prestige
                addTransaction('Income', 'Wine Sale', totalSellingPrice);
                applyPrestigeHit(totalSellingPrice / 1000);

                // Update orders and inventory
                wineOrders.splice(orderIndex, 1);
                saveWineOrders(wineOrders);
                inventoryInstance.save();

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

    // Use a linear scaling for lower prestige values (0-100)
    if (companyPrestige <= 100) {
        chance = 0.2 + (companyPrestige / 100) * (0.5 - 0.2);
    } else {
        // Use a non-linear curve for higher prestige values
        // Approaches but never exceeds 99% chance
        chance = 0.5 + (Math.atan((companyPrestige - 100) / 200) / Math.PI) * (0.99 - 0.5);
    }

    // Ensure chance never exceeds maximum (99%) and use random check
    return Math.random() < Math.min(chance, 0.99);
}
