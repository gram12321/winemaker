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

// Calculate base wine price based on land value and field prestige
// Base price is typically between 10-100€ depending on region and farmland quality
// Land value and field prestige each contribute 50% to the base price
/*
The land value now has a more prominent role in price calculation:
- 50% direct contribution to base price (up from 33.3%)
- Additional indirect contribution through field prestige
- Results in land value determining approximately 60-65% of the base price
- Premium wine regions (Burgundy, Champagne, Napa Valley) can exceed the 100€ base price cap
*/
export function calculateBaseWinePrice(quality, landValue, prestige) {
    // Normalize our inputs
    const normalizedLandValue = normalizeLandValue(landValue);
    
    // Calculate base price without quality:
    // Average of two factors, each multiplied by 100
    // This gives us the same 0-100€ range
    const basePrice = (normalizedLandValue * 100 + prestige * 100) / 2;
    return basePrice;
}

/**
 * Extreme quality multiplier using a logistic function
 * Maps 0-1 values to multipliers where:
 * - Values below 0.7 get modest multipliers (1-2x)
 * - Values around 0.9 get moderate multipliers (~5x)
 * - Values above 0.95 grow exponentially
 * - Values approaching 0.99 and above yield astronomical multipliers
 * 
 * This creates a wine pricing model where:
 * - ~90% of wines are below €100 (average quality wines));
 * - ~9% are between €100-€1,000 (excellent wines)
 * - ~0.9% are between €1,000-€10,000 (exceptional wines)
 * - Only ~0.1% exceed €10,000 (legendary wines)
 * 
 * Examples:
 * 0.5 -> ~1.1x
 * 0.8 -> ~2x
 * 0.9 -> ~5x
 * 0.95 -> ~20x
 * 0.98 -> ~100x
 * 0.99 -> ~500x
 * 0.995 -> ~1000x
 */
export function calculateExtremeQualityMultiplier(value, steepness = 100, midpoint = 0.92) {
    // Ensure value is between 0 and 0.99999
    const safeValue = Math.min(0.99999, Math.max(0, value || 0));
    
    if (safeValue < 0.5) {
        // Below average quality gets a small penalty
        return 0.8 + (safeValue * 0.4);
    } else if (safeValue < 0.7) {
        // Average quality gets approximately 1x multiplier
        return 1.0 + ((safeValue - 0.5) * 0.5);
    } else {
        // Higher quality grows exponentially using a modified logistic function
        // The formula: 1 + base * (1 / (1 + Math.exp(-steepness * (value - midpoint))))
        // This creates an S-curve with explosive growth after the midpoint
        const baseMultiplier = 100000; // Maximum potential multiplier
        const logisticComponent = 1 / (1 + Math.exp(-steepness * (safeValue - midpoint)));
        
        return 1 + (baseMultiplier * logisticComponent);
    }
}

// Calculate wine price by applying extreme quality/balance multiplier to base price
// The final price incorporates:
// 1. Base price (land value + field prestige)
// 2. Quality (60% weight in combined score)
// 3. Balance (40% weight in combined score)
// 
// The logistic multiplier creates the possibility of extremely valuable wines
// when both quality and balance are exceptional (>0.95), while keeping
// average wines (quality/balance ~0.5-0.7) at reasonable prices
export function calculateWinePrice(quality, wine) {
    const farmlands = getFarmlands();
    const farmland = farmlands.find(field => field.name === wine.fieldName);
    if (!farmland) return 0;
    
    // Calculate the base price (typically 10-50€)
    const basePrice = calculateBaseWinePrice(quality, farmland.landvalue, wine.fieldPrestige);
    
    // Get quality and balance values, defaulting to 0.5 if not present
    const qualityValue = quality !== undefined ? quality : 0.5;
    const balanceValue = wine.balance !== undefined ? wine.balance : 0.5;
    
    // First, calculate a combined quality score giving more weight to quality (60%) than balance (40%)
    const combinedScore = (qualityValue * 0.6) + (balanceValue * 0.4);
    
    // Then apply our extreme multiplier function to the combined score
    const priceMultiplier = calculateExtremeQualityMultiplier(combinedScore);
    
    // Calculate final price by multiplying base price by our extreme multiplier
    return basePrice * priceMultiplier;
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