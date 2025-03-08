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

export function sellWines(resourceName) {
    const bottledWine = inventoryInstance.getItemsByState('Bottles').find(item => item.resource.name === resourceName);

    if (bottledWine && bottledWine.amount > 0) {
        const farmlands = getFarmlands();
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
            setPrestigeHit(getPrestigeHit() + sellingPrice / 1000);
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

// Store user-set prices for wines
const userPrices = {};

// Set a price for a specific wine
export function setWinePrice(resourceName, vintage, fieldName, price) {
    const key = `${resourceName}_${vintage}_${fieldName}`;
    userPrices[key] = parseFloat(price);
    localStorage.setItem('userWinePrices', JSON.stringify(userPrices));
    return true;
}

// Get the user-set price for a specific wine
export function getWinePrice(resourceName, vintage, fieldName) {
    const key = `${resourceName}_${vintage}_${fieldName}`;
    const prices = JSON.parse(localStorage.getItem('userWinePrices') || '{}');
    return prices[key] || null;
}

// Load all user-set prices
export function loadUserPrices() {
    const prices = JSON.parse(localStorage.getItem('userWinePrices') || '{}');
    Object.assign(userPrices, prices);
    return userPrices;
}

// Generate a random wine order based on available inventory and user-set prices
export function generateWineOrder() {
    // Get all bottled wines from inventory that have a price set
    const bottledWines = inventoryInstance.items.filter(item => {
        if (item.state !== 'Bottles') return false;
        
        // Check if this wine has a price set
        const key = `${item.resource.name}_${item.vintage}_${item.fieldName}`;
        return userPrices[key] !== undefined;
    });

    // Check if we have any bottles with prices set
    if (bottledWines.length === 0) {
        return; // Don't generate orders if no prices are set
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

    // Get the base price and user-set price
    const basePrice = calculateWinePrice(selectedWine.quality, selectedWine);
    const userPrice = getWinePrice(selectedWine.resource.name, selectedWine.vintage, selectedWine.fieldName);
    
    if (userPrice === null) return; // Shouldn't happen but just in case
    
    // Calculate price difference percentage from base price
    const priceDiffPercent = (userPrice - basePrice) / basePrice;
    
    // Modify order generation probability based on price difference
    const priceAdjustmentFactor = Math.max(0, 1 - Math.abs(priceDiffPercent));
    
    // If price is higher than base, fewer orders. If lower, more orders.
    if (priceDiffPercent > 0) {
        // Price is higher than base, reduce chance of orders
        if (Math.random() > priceAdjustmentFactor) {
            return; // Skip order generation
        }
    }
    
    const orderTypeKeys = Object.keys(orderTypes);
    const selectedOrderTypeKey = orderTypeKeys[Math.floor(Math.random() * orderTypeKeys.length)];
    const selectedOrderType = orderTypes[selectedOrderTypeKey];

    // Adjust amount based on price - more bottles for cheaper wine
    let amountMultiplier = selectedOrderType.amountMultiplier;
    if (priceDiffPercent < 0) {
        // Increase orders for cheaper wine
        amountMultiplier *= (1 + Math.abs(priceDiffPercent) * 0.5);
    }

    const baseAmount = Math.round((0.5 + Math.random() * 1.5) * (1 + 2 * selectedWine.fieldPrestige));
    
    const newOrder = {
        type: selectedOrderTypeKey,
        resourceName: selectedWine.resource.name,
        fieldName: selectedWine.fieldName,
        vintage: selectedWine.vintage,
        quality: selectedWine.quality,
        amount: Math.round(baseAmount * amountMultiplier),
        wineOrderPrice: userPrice
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

    if (!order) {
        addConsoleMessage('Invalid wine order index.');
        return false;
    }

    const bottledWine = inventoryInstance.items.find(item =>
        item.resource.name === order.resourceName &&
        item.state === 'Bottles' &&
        item.vintage === order.vintage &&
        item.quality === order.quality
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
    // Only generate orders if there's at least one wine with a price set
    const prices = loadUserPrices();
    if (Object.keys(prices).length === 0) {
        return false;
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