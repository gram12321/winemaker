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
    const customPrice = parseFloat(localStorage.getItem('wineCustomPrice'));

    // Don't sell if no price is set
    if (!customPrice) {
        addConsoleMessage('Cannot sell wine: No price has been set.');
        return;
    }

    if (bottledWine && bottledWine.amount > 0) {
        const farmlands = getFarmlands();
        const farmland = farmlands.find(field => field.name === bottledWine.fieldName);

        if (!farmland) {
            addConsoleMessage('Error: Could not find farmland data.');
            return;
        }

        // Use the custom price set by the user
        const sellingPrice = customPrice;

        if (inventoryInstance.removeResource(
            { name: resourceName }, 
            1, 
            'Bottles', 
            bottledWine.vintage, 
            bottledWine.storage
        )) {
            // Calculate the base price for reference
            const basePrice = calculateWinePrice(bottledWine.quality, bottledWine);
            const priceDiff = ((sellingPrice - basePrice) / basePrice) * 100;
            let priceComment = '';
            
            if (priceDiff > 20) {
                priceComment = ' (Excellent price!)';
            } else if (priceDiff < -20) {
                priceComment = ' (Below market value)';
            }
            
            addConsoleMessage(
                `Sold 1 bottle of ${bottledWine.resource.name}, ` +
                `Vintage ${bottledWine.vintage}, ` +
                `Quality ${(bottledWine.quality * 100).toFixed(0)}% ` +
                `for €${sellingPrice.toFixed(2)}${priceComment}.`
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

// Generate a random wine order based on available inventory and company prestige
export function generateWineOrder() {
    // Get all bottled wines from inventory
    const bottledWines = inventoryInstance.items.filter(item => item.state === 'Bottles');

    // Check if we have any bottles to sell
    if (bottledWines.length === 0) {
        addConsoleMessage("A customer wants to buy wine, but there are no bottles in the wine cellar.");
        return;
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

export function shouldGenerateWineOrder(customPrice) {
    // Don't generate orders if no price is set
    if (!customPrice) return false;
    
    const companyPrestige = parseFloat(localStorage.getItem('companyPrestige')) || 0;
    
    // Get sample wine to compare prices
    const bottledWines = inventoryInstance.getItemsByState('Bottles');
    if (bottledWines.length === 0) return false;
    
    // Choose a random wine to calculate base price
    const randomWine = bottledWines[Math.floor(Math.random() * bottledWines.length)];
    const basePrice = calculateWinePrice(randomWine.quality, randomWine);
    
    // Calculate price difference as percentage
    const priceDifference = ((customPrice - basePrice) / basePrice);
    
    // Base chance from company prestige
    let prestigeChance;
    if (companyPrestige <= 100) {
        prestigeChance = 0.2 + (companyPrestige / 100) * (0.5 - 0.2);
    } else {
        prestigeChance = 0.5 + (Math.atan((companyPrestige - 100) / 200) / Math.PI) * (0.99 - 0.5);
    }
    
    // Modify chance based on price difference
    // Lower prices increase chance, higher prices decrease chance
    let priceModifier;
    if (priceDifference <= -0.3) { // Very low price (30% or more below base)
        priceModifier = 0.4; // Much higher chance
    } else if (priceDifference <= -0.1) { // Somewhat low price (10-30% below base)
        priceModifier = 0.2; // Higher chance
    } else if (priceDifference <= 0.1) { // Close to base price (±10%)
        priceModifier = 0; // Neutral effect
    } else if (priceDifference <= 0.3) { // Somewhat high price (10-30% above base)
        priceModifier = -0.2; // Lower chance
    } else { // Very high price (30% or more above base)
        priceModifier = -0.35; // Much lower chance
    }
    
    const finalChance = Math.min(Math.max(prestigeChance + priceModifier, 0.05), 0.99);
    return Math.random() < finalChance;
}