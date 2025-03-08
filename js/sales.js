import { normalizeLandValue } from './names.js';
import { addConsoleMessage } from './console.js';
import { addTransaction } from './finance.js';
import { setPrestigeHit, getPrestigeHit } from './database/adminFunctions.js';
import { inventoryInstance } from './resource.js';
import { displayWineCellarInventory } from './overlays/mainpages/salesoverlay.js';
import { calculateRealPrestige } from './company.js';
import { loadWineOrders, saveWineOrders, getFarmlands } from './database/adminFunctions.js';

export function removeWineOrder(index) {
    const wineOrders = loadWineOrders();
    if (index >= 0 && index < wineOrders.length) {
        wineOrders.splice(index, 1);
        saveWineOrders(wineOrders);
        return true;
    }
    return false;
}

export function addWineOrder(order) {
    const wineOrders = loadWineOrders();
    wineOrders.push(order);
    saveWineOrders(wineOrders);
}

// Store custom prices for wines
const customWinePrices = new Map();

export function setCustomWinePrice(resourceName, vintage, storage, price) {
    const key = `${resourceName}-${vintage}-${storage}`;
    customWinePrices.set(key, parseFloat(price));
}

export function getCustomWinePrice(resourceName, vintage, storage) {
    const key = `${resourceName}-${vintage}-${storage}`;
    return customWinePrices.get(key) || null;
}

export function hasCustomPrice(resourceName, vintage, storage) {
    const key = `${resourceName}-${vintage}-${storage}`;
    return customWinePrices.has(key);
}

export function sellWines(resourceName, vintage, storage) {
    const bottledWine = inventoryInstance.getItemsByState('Bottles').find(item => 
        item.resource.name === resourceName && 
        item.vintage === vintage && 
        item.storage === storage);

    if (bottledWine && bottledWine.amount > 0) {
        const farmlands = getFarmlands();
        const farmland = farmlands.find(field => field.name === bottledWine.fieldName);

        if (!farmland) {
            addConsoleMessage('Error: Could not find farmland data.');
            return;
        }

        // Get custom price or calculate base price
        const customPrice = getCustomWinePrice(resourceName, vintage, storage);
        if (customPrice === null) {
            addConsoleMessage('Cannot sell wine without a custom price. Please set a price first.');
            return;
        }

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
                `for €${customPrice.toFixed(2)}.`
            );

            addTransaction('Income', 'Wine Sale', customPrice);
            setPrestigeHit(getPrestigeHit() + customPrice / 1000);
            calculateRealPrestige();
            inventoryInstance.save();
        }
    }
}

// Calculate wine price based on quality, land value, and field prestige // Capped at 100€ for non-top3 regions. As quality 0-1, land value 0-1, field prestige 0-1, thus maximum baseprice is 100€. (Ie we ware multiplying 3 normalized values of 0-1 by 100 
/*
Landvalue is aprox 41% of price as it is in both normalized value (1/3) and field prestige (1/4) each contributing 1/3 to baseprice) 
33.3% (direct contribution)
8.3% (through field prestige: 25% of 33.3%)
Total impact: approximately 41.6% of the final wine price */

export function calculateBaseWinePrice(quality, landValue, prestige, balance = 0.5) {
    // Normalize our inputs
    const normalizedLandValue = normalizeLandValue(landValue);

    // Calculate base price using only land value and prestige
    const basePriceLandAndPrestige = (normalizedLandValue * 100 + prestige * 100) / 2;

    // Multiply by balance and quality factors with no default
    const basePrice = basePriceLandAndPrestige * balance * quality;

    return basePrice;
}

export function calculateWinePrice(quality, wine) {
    const farmlands = getFarmlands();
    const farmland = farmlands.find(field => field.name === wine.fieldName);
    if (!farmland) return 0;

    // Use the wine's balance value in price calculation
    return calculateBaseWinePrice(quality, farmland.landvalue, wine.fieldPrestige, wine.balance);
}

// Generate a random wine order based on available inventory and company prestige
export function generateWineOrder() {
    // Get only bottled wines with custom prices
    const bottledWines = inventoryInstance.items.filter(item => 
        item.state === 'Bottles' && 
        hasCustomPrice(item.resource.name, item.vintage, item.storage)
    );

    // Check if we have any bottles with prices to sell
    if (bottledWines.length === 0) {
        return; // Silently return, no message needed as this is now expected behavior
    }

    const orderTypes = {
        "Private Order": { amountMultiplier: 1, priceMultiplier: 1 },
        "Engross Order": { amountMultiplier: 10, priceMultiplier: 0.85 }
    };

    const selectedWine = bottledWines[Math.floor(Math.random() * bottledWines.length)];
    const farmlands = getFarmlands();
    const farmland = farmlands.find(field => field.name === selectedWine.fieldName);

    if (!farmland) {
        addConsoleMessage('Error: Could not generate wine order due to missing farmland data.');
        return;
    }

    // Get custom price and calculate base price for comparison
    const customPrice = getCustomWinePrice(
        selectedWine.resource.name, 
        selectedWine.vintage, 
        selectedWine.storage
    );

    const basePrice = calculateWinePrice(
        selectedWine.quality,
        selectedWine
    );

    // Calculate price percentage difference
    const priceDifference = (customPrice / basePrice) - 1;

    // Adjust order generation based on price difference
    // More orders for lower prices, fewer orders for higher prices
    let orderChanceMultiplier = 1;
    if (priceDifference < 0) {
        // Lower price than base - increased chance
        orderChanceMultiplier = 1 + Math.min(Math.abs(priceDifference), 0.5);
    } else {
        // Higher price than base - decreased chance
        orderChanceMultiplier = 1 - Math.min(priceDifference * 0.8, 0.8);
    }

    // Skip order generation if random chance exceeds our multiplier
    if (Math.random() > orderChanceMultiplier) {
        return;
    }

    const orderTypeKeys = Object.keys(orderTypes);
    const selectedOrderTypeKey = orderTypeKeys[Math.floor(Math.random() * orderTypeKeys.length)];
    const selectedOrderType = orderTypes[selectedOrderTypeKey];

    const baseAmount = Math.round((0.5 + Math.random() * 1.5) * (1 + 2 * selectedWine.fieldPrestige));

    // Calculate order price based on custom price
    const finalOrderPrice = customPrice * selectedOrderType.priceMultiplier;

    const newOrder = {
        type: selectedOrderTypeKey,
        resourceName: selectedWine.resource.name,
        fieldName: selectedWine.fieldName,
        vintage: selectedWine.vintage,
        quality: selectedWine.quality,
        storage: selectedWine.storage, // Add storage for identification
        amount: baseAmount * selectedOrderType.amountMultiplier,
        wineOrderPrice: finalOrderPrice
    };

    addWineOrder(newOrder);
    addConsoleMessage(
        `Created ${newOrder.type} for ${newOrder.amount} bottles of ` +
        `${newOrder.resourceName}, Vintage ${newOrder.vintage}, ` +
        `Quality ${(newOrder.quality * 100).toFixed(0)}%, ` +
        `Price €${finalOrderPrice.toFixed(2)}.`
    );
}

export function sellOrderWine(orderIndex) {
    const wineOrders = loadWineOrders();
    const order = wineOrders[orderIndex];

    if (!order) {
        addConsoleMessage('Invalid wine order index.');
        return false;
    }

    const bottledWine = inventoryInstance.items.find(item =>
        item.resource.name === order.resourceName &&
        item.state === 'Bottles' &&
        item.vintage === order.vintage &&
        item.quality === order.quality &&
        (order.storage ? item.storage === order.storage : true)
    );

    if (!bottledWine || bottledWine.amount < order.amount) {
        addConsoleMessage('Insufficient inventory to complete this order.');
        return false;
    }

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
        setPrestigeHit(getPrestigeHit() + totalSellingPrice / 1000);
        calculateRealPrestige();

        if (!removeWineOrder(orderIndex)) {
            addConsoleMessage('Error removing wine order.');
            return false;
        }

        inventoryInstance.save();
        displayWineCellarInventory();
        return true;
    }
    return false;
}

export function shouldGenerateWineOrder() {
    // First check if any wines have custom prices set
    const bottledWines = inventoryInstance.getItemsByState('Bottles');
    const anyCustomPriced = bottledWines.some(wine => 
        hasCustomPrice(wine.resource.name, wine.vintage, wine.storage)
    );

    if (!anyCustomPriced) {
        return false; // Don't generate orders if no wines have custom prices
    }

    const companyPrestige = parseFloat(localStorage.getItem('companyPrestige')) || 0;
    let chance;

    if (companyPrestige <= 100) {
        chance = 0.2 + (companyPrestige / 100) * (0.5 - 0.2);
    } else {
        chance = 0.5 + (Math.atan((companyPrestige - 100) / 200) / Math.PI) * (0.99 - 0.5);
    }

    return Math.random() < Math.min(chance, 0.99);
}