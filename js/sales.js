import { normalizeLandValue } from './names.js';
import { addConsoleMessage } from './console.js';
import { addTransaction } from './finance.js';
import { setPrestigeHit, getPrestigeHit } from './database/adminFunctions.js';
import { inventoryInstance } from './resource.js';
import { displayWineCellarInventory } from './overlays/mainpages/salesoverlay.js';
import { calculateRealPrestige } from './company.js';
import { loadWineOrders, saveWineOrders, getFarmlands } from './database/adminFunctions.js';
import {updateAllDisplays } from './displayManager.js';

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
    // Get all bottled wines from inventory that have custom prices set
    const bottledWines = inventoryInstance.items.filter(item => 
        item.state === 'Bottles' && item.customPrice && item.customPrice > 0
    );

    // Check if we have any bottles with prices to sell
    if (bottledWines.length === 0) {
        addConsoleMessage("A customer might be interested in wine, but you need to set prices for your bottles first.");
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

    // Calculate base price for reference
    const calculatedBasePrice = calculateWinePrice(selectedWine.quality, selectedWine);

    // Calculate price based on custom price and deviation from base price
    // If custom price is lower than base, orders are more likely and with higher volumes
    // If custom price is higher than base, orders are less likely and with lower volumes
    const priceDifference = selectedWine.customPrice / calculatedBasePrice;

    console.log(`[Wine Order] Selected wine: ${selectedWine.resource.name}, Vintage: ${selectedWine.vintage}, Quality: ${(selectedWine.quality * 100).toFixed(1)}%`);
    console.log(`[Wine Order] Base price calculation: €${calculatedBasePrice.toFixed(2)}, Custom price set: €${selectedWine.customPrice.toFixed(2)}`);
    console.log(`[Wine Order] Price difference ratio: ${priceDifference.toFixed(2)} (custom/base)`);

    // Adjust amount based on price difference
    let amountAdjustment = 1;
    if (priceDifference < 1) {
        // Lower price means more bottles ordered (up to +50%)
        amountAdjustment = 1 + Math.min((1 - priceDifference) * 1.25, 0.5);
        console.log(`[Wine Order] Lower price: increasing order amount by ${((amountAdjustment - 1) * 100).toFixed(1)}%`);
    } else if (priceDifference > 1) {
        // Higher price means fewer bottles ordered (down to -60%)
        amountAdjustment = 1 - Math.min((priceDifference - 1) * 0.75, 0.6);
        console.log(`[Wine Order] Higher price: decreasing order amount by ${((1 - amountAdjustment) * 100).toFixed(1)}%`);
    } else {
        console.log(`[Wine Order] Price matches base price, no adjustment needed`);
    }

    // Order price will typically be somewhat lower than the custom price (haggling)
    const minHagglingFactor = 0.8;
    const maxHagglingFactor = 1.1;
    const randomFactor = minHagglingFactor + Math.random() * (maxHagglingFactor - minHagglingFactor);
    const orderPrice = selectedWine.customPrice * randomFactor;
    console.log(`[Wine Order] Haggling factor: ${randomFactor.toFixed(2)}, Negotiated price: €${orderPrice.toFixed(2)} (before type adjustment)`);
    console.log(`[Wine Order] Haggling range: €${(selectedWine.customPrice * minHagglingFactor).toFixed(2)} to €${(selectedWine.customPrice * maxHagglingFactor).toFixed(2)}`);

    // Calculate base amount
    const minBaseFactor = 0.5;
    const maxBaseFactor = 2.0;
    const randomBaseFactor = minBaseFactor + Math.random() * (maxBaseFactor - minBaseFactor);
    const prestigeEffect = 1 + 2 * selectedWine.fieldPrestige;
    const baseAmount = Math.round(randomBaseFactor * prestigeEffect * amountAdjustment);

    // Calculate possible amount range
    const minPossibleAmount = Math.round(minBaseFactor * prestigeEffect * amountAdjustment);
    const maxPossibleAmount = Math.round(maxBaseFactor * prestigeEffect * amountAdjustment);

    console.log(`[Wine Order] Amount calculation:`);
    console.log(`  - Random base factor: ${randomBaseFactor.toFixed(2)} (range: ${minBaseFactor.toFixed(1)}-${maxBaseFactor.toFixed(1)})`);
    console.log(`  - Field prestige effect: ${prestigeEffect.toFixed(2)} (from prestige ${selectedWine.fieldPrestige.toFixed(2)})`);
    console.log(`  - Price difference adjustment: ${amountAdjustment.toFixed(2)}`);
    console.log(`  - Base amount before type multiplier: ${baseAmount} (possible range: ${minPossibleAmount}-${maxPossibleAmount})`);

    const finalAmount = Math.max(1, Math.round(baseAmount * selectedOrderType.amountMultiplier));
    const finalPrice = orderPrice * selectedOrderType.priceMultiplier;

    // Calculate possible final amount range
    const minFinalAmount = Math.max(1, Math.round(minPossibleAmount * selectedOrderType.amountMultiplier));
    const maxFinalAmount = Math.max(1, Math.round(maxPossibleAmount * selectedOrderType.amountMultiplier));

    // Calculate possible final price range
    const minFinalPrice = selectedWine.customPrice * minHagglingFactor * selectedOrderType.priceMultiplier;
    const maxFinalPrice = selectedWine.customPrice * maxHagglingFactor * selectedOrderType.priceMultiplier;

    console.log(`[Wine Order] Final order: type=${selectedOrderTypeKey} (multipliers: amount=${selectedOrderType.amountMultiplier}, price=${selectedOrderType.priceMultiplier})`);
    console.log(`[Wine Order] Final amount: ${finalAmount} (possible range: ${minFinalAmount}-${maxFinalAmount})`);
    console.log(`[Wine Order] Final price: €${finalPrice.toFixed(2)} (possible range: €${minFinalPrice.toFixed(2)}-€${maxFinalPrice.toFixed(2)})`);

    const newOrder = {
        type: selectedOrderTypeKey,
        resourceName: selectedWine.resource.name,
        fieldName: selectedWine.fieldName,
        vintage: selectedWine.vintage,
        quality: selectedWine.quality,
        amount: finalAmount,
        wineOrderPrice: finalPrice
    };

    addWineOrder(newOrder);
    addConsoleMessage(
        `Created ${newOrder.type} for ${newOrder.amount} bottles of ` +
        `${newOrder.resourceName}, Vintage ${newOrder.vintage}, ` +
        `Quality ${(newOrder.quality * 100).toFixed(0)}%, ` +
        `Price €${newOrder.wineOrderPrice.toFixed(2)}.`
    );
    updateAllDisplays();
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

    // Use the order's original price * amount for total selling price
    const totalSellingPrice = order.wineOrderPrice * order.amount;

    console.log('[Wine Sale] Order details:', {
        offeredPrice: order.wineOrderPrice,
        amount: order.amount,
        totalSellingPrice: totalSellingPrice
    });

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
    // Get all bottled wines with custom prices
    const winesWithPrices = inventoryInstance.getItemsByState('Bottles').filter(wine => wine.customPrice > 0);

    // If no wines have prices set, return false - no orders should be generated
    if (winesWithPrices.length === 0) {
        return false;
    }

    const companyPrestige = calculateRealPrestige();
    let baseChance;

    // Calculate base chance based on company prestige
    if (companyPrestige <= 100) {
        baseChance = 0.2 + (companyPrestige / 100) * (0.5 - 0.2);
    } else {
        baseChance = 0.5 + (Math.atan((companyPrestige - 100) / 200) / Math.PI) * (0.99 - 0.5);
    }

    console.log(`[Order Generation] Base chance calculation: ${(baseChance * 100).toFixed(1)}% (based on company prestige ${companyPrestige.toFixed(1)})`);

    // Adjust chance based on pricing strategy
    let priceModifier = 1.0;

    // Calculate average price deviation from base price
    let totalDeviation = 0;
    winesWithPrices.forEach(wine => {
        const basePrice = calculateWinePrice(wine.quality, wine);
        if (basePrice > 0) {
            const deviation = (wine.customPrice - basePrice) / basePrice;
            totalDeviation += deviation;
        }
    });

    const avgDeviation = totalDeviation / winesWithPrices.length;
    console.log(`[Order Generation] Average price deviation: ${(avgDeviation * 100).toFixed(1)}% from base prices`);

    // Adjust chance based on pricing strategy:
    // Lower prices (negative deviation) increase chance
    // Higher prices (positive deviation) decrease chance
    // The effect is stronger for larger deviations
    if (avgDeviation < 0) {
        // Cheaper than base price - increase chance (up to +50%)
        priceModifier = 1 + Math.min(Math.abs(avgDeviation), 0.5);
        console.log(`[Order Generation] Lower prices: increasing order chance by ${((priceModifier - 1) * 100).toFixed(1)}%`);
    } else {
        // More expensive than base price - decrease chance (down to -70%)
        priceModifier = 1 - Math.min(avgDeviation * 1.4, 0.7);
        console.log(`[Order Generation] Higher prices: decreasing order chance by ${((1 - priceModifier) * 100).toFixed(1)}%`);
    }

    const finalChance = Math.min(baseChance * priceModifier, 0.99);
    const randomValue = Math.random();
    const willGenerate = randomValue < finalChance;

    console.log(`[Order Generation] Final chance: ${(finalChance * 100).toFixed(1)}%, Random value: ${(randomValue * 100).toFixed(1)}%, Will generate: ${willGenerate}`);

    return willGenerate;
}