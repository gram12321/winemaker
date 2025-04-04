import { normalizeLandValue } from './names.js';
import { addConsoleMessage } from './console.js';
import { addTransaction } from './finance.js';
import { setPrestigeHit, getPrestigeHit } from './database/adminFunctions.js';
import { inventoryInstance } from './resource.js';
import { displayWineCellarInventory } from './overlays/mainpages/salesoverlay.js';
import { calculateRealPrestige } from './company.js';
import { loadWineOrders, saveWineOrders, getFarmlands } from './database/adminFunctions.js';
import {updateAllDisplays } from './displayManager.js';
import { calculateAgeContribution, calculateLandValueContribution, calculatePrestigeRankingContribution, calculateFragilityBonusContribution } from './farmland.js';
import { 
    WINE_ORDER_TYPES, 
    ORDER_AMOUNT_FACTORS, 
    PRICE_NEGOTIATION,
    ORDER_GENERATION
} from './constants/constants.js';

// Helper function for better console logging
function logTable(title, data, collapsed = false) {
    if (collapsed) {
        console.groupCollapsed(title);
    } else {
        console.group(title);
    }
    
    if (Array.isArray(data)) {
        console.table(data);
    } else {
        console.table([data]);
    }
    
    console.groupEnd();
}

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
 * - Values below 0.7 get modest multipliers (0.8-1.25x)
 * - Values around 0.9 get moderate multipliers (~3-5x)
 * - Values above 0.95 grow more quickly (~10-50x)
 * - Only values approaching 0.99+ yield astronomical multipliers (>100x)
 * 
 * This creates a wine pricing model where:
 * - ~90% of wines are below €100 (average quality wines)
 * - ~9% are between €100-€1,000 (excellent wines)
 * - ~0.9% are between €1,000-€10,000 (exceptional wines)
 * - Only ~0.1% exceed €10,000 (legendary wines, requiring >0.98 quality AND balance)
 */
export function calculateExtremeQualityMultiplier(value, steepness = 80, midpoint = 0.95) {
    // Ensure value is between 0 and 0.99999
    const safeValue = Math.min(0.99999, Math.max(0, value || 0));
    
    if (safeValue < 0.5) {
        // Below average quality gets a small penalty but never below 0.8x
        return 1 + (safeValue * 0.4);
    } else if (safeValue < 0.7) {
        // Average quality gets approximately 1x multiplier
        return 1.1 + ((safeValue - 0.5) * 0.5);
    } else if (safeValue < 0.9) {
        // Good quality gets a modest boost (1.25x-3x)
        return 1.25 + ((safeValue - 0.7) * 8.75);
    } else if (safeValue < 0.95) {
        // Excellent quality gets a stronger boost (3x-10x)
        return 3 + ((safeValue - 0.9) * 140);
    } else if (safeValue < 0.98) {
        // Exceptional quality (0.95-0.98) gets a significant boost (10x-50x)
        return 10 + ((safeValue - 0.95) * 1333.33);
    } else {
        // Only truly extraordinary quality (>0.98) gets the extreme multipliers
        // This makes astronomical prices much rarer
        const ultraQualityFactor = safeValue - 0.98;
        const baseMultiplier = 50;
        const exponentialGrowth = Math.pow(10000, ultraQualityFactor * 5); // 0-2 range becomes 1-10000
        
        return baseMultiplier * exponentialGrowth;
    }
}

// Calculate wine price by applying extreme quality/balance multiplier to base price
// The final price incorporates:
// 1. Base price (land value + field prestige)
// 2. Quality (50% weight in combined score)
// 3. Balance (50% weight in combined score)
// 
// The logistic multiplier creates the possibility of extremely valuable wines
// when both quality and balance are exceptional (>0.95), while keeping
// average wines (quality/balance ~0.5-0.7) at reasonable prices
export function calculateWinePrice(quality, wine, skipLogging = true) {
    const farmlands = getFarmlands();
    const farmland = farmlands.find(field => field.name === wine.fieldName);
    if (!farmland) return 0;
    
    // Calculate the base price (typically 10-50€)
    const basePrice = calculateBaseWinePrice(quality, farmland.landvalue, wine.fieldPrestige);
    const qualityValue = quality;
    const balanceValue = wine.balance;
    const combinedScore = ((qualityValue + balanceValue) / 2);
    const priceMultiplier = calculateExtremeQualityMultiplier(combinedScore);
    const finalPrice = basePrice * priceMultiplier;
    
    // Log detailed price calculation information (unless skipLogging is true)
    if (!skipLogging) {
        logWinePriceCalculation(basePrice, quality, wine, farmland);
    }
    
    return finalPrice;
}


export function logWinePriceCalculation(basePrice, quality, wine, farmland) {
    // Check if we have all needed data
    if (!farmland || !wine) {
        console.log("[Wine Price] Missing data for price calculation");
        return;
    }
    
    // Get quality and balance values
    const qualityValue = quality !== undefined ? quality : 0;
    const balanceValue = wine.balance !== undefined ? wine.balance : 0;
    
    // 1. Calculate normalized land value
    const normalizedLandValue = normalizeLandValue(farmland.landvalue);
    
    // 2. Calculate base price components
    const landValueComponent = normalizedLandValue * 100 / 2; // 50% of base price
    const fieldPrestigeComponent = wine.fieldPrestige * 100 / 2; // 50% of base price
    
    // 3. Calculate combined quality score and multiplier
    const combinedScore = (qualityValue + balanceValue) / 2;
    const priceMultiplier = calculateExtremeQualityMultiplier(combinedScore);
    
    // 4. Calculate final price
    const finalPrice = basePrice * priceMultiplier;
    
    // 5. Calculate field prestige components
    const vineAgeContribution = calculateAgeContribution(farmland.vineAge);
    const landPrestigeContribution = calculateLandValueContribution(farmland.landvalue);
    const regionPrestigeContribution = calculatePrestigeRankingContribution(farmland.region, farmland.country);
    const fragilityContribution = calculateFragilityBonusContribution(farmland.plantedResourceName);
    const totalContribution = vineAgeContribution + landPrestigeContribution + regionPrestigeContribution + fragilityContribution;
    
    // 6. Calculate percentage of land value's total influence
    const directLandValueContribution = landValueComponent;
    const indirectLandValueContribution = calculateLandValueContribution(farmland.landvalue) / wine.fieldPrestige * fieldPrestigeComponent;
    const totalLandValueInfluence = directLandValueContribution + indirectLandValueContribution;
    const landValuePercentage = (totalLandValueInfluence / basePrice) * 100;
    
    // 7. Output percentage contribution to final price
    const qualityEffect = (finalPrice - basePrice) * 0.5; // 50% weight from quality
    const balanceEffect = (finalPrice - basePrice) * 0.5; // 50% weight from balance
    
    // Use console.group and console.table for better logging
    console.group(`[Wine Price] ${wine.resource.name} (${wine.vintage})`);
    
    // Basic wine info
    logTable("Wine Information", {
        Wine: wine.resource.name,
        Vintage: wine.vintage,
        Field: wine.fieldName,
        Quality: qualityValue.toFixed(3),
        Balance: balanceValue.toFixed(3),
        "Field Prestige": wine.fieldPrestige.toFixed(3)
    });
    
    // Base price calculation
    logTable("Base Price Calculation", {
        "Land Value (Raw)": `€${farmland.landvalue}`,
        "Normalized Land Value": normalizedLandValue.toFixed(3),
        "Land Value Component": `€${landValueComponent.toFixed(2)}`,
        "Field Prestige Component": `€${fieldPrestigeComponent.toFixed(2)}`,
        "Total Base Price": `€${basePrice.toFixed(2)}`
    });
    
    // Quality multiplier calculation
    logTable("Quality Multiplier", {
        "Quality": qualityValue.toFixed(3),
        "Balance": balanceValue.toFixed(3),
        "Combined Score": combinedScore.toFixed(3),
        "Resulting Multiplier": `${priceMultiplier.toFixed(2)}x`
    });
    
    // Field prestige breakdown
    if (wine.fieldPrestige > 0) {
        logTable("Field Prestige Breakdown", [
            { Factor: "Vine Age", Value: `${farmland.vineAge} years`, Contribution: vineAgeContribution.toFixed(3) },
            { Factor: "Land Value", Value: `€${farmland.landvalue}`, Contribution: landPrestigeContribution.toFixed(3) },
            { Factor: "Region", Value: `${farmland.region}, ${farmland.country}`, Contribution: regionPrestigeContribution.toFixed(3) },
            { Factor: "Grape Type", Value: farmland.plantedResourceName, Contribution: fragilityContribution.toFixed(3) },
            { Factor: "Total", Value: "", Contribution: totalContribution.toFixed(3) }
        ]);
    }
    
    // Final price contribution factors
    logTable("Price Contribution Factors", [
        { Factor: "Land Value (Direct)", Value: `€${directLandValueContribution.toFixed(2)}`, Percentage: `${(directLandValueContribution/finalPrice*100).toFixed(1)}%` },
        { Factor: "Land Value (through Prestige)", Value: `€${indirectLandValueContribution.toFixed(2)}`, Percentage: `${(indirectLandValueContribution/finalPrice*100).toFixed(1)}%` },
        { Factor: "Other Prestige Factors", Value: `€${(fieldPrestigeComponent-indirectLandValueContribution).toFixed(2)}`, Percentage: `${((fieldPrestigeComponent-indirectLandValueContribution)/finalPrice*100).toFixed(1)}%` },
        { Factor: "Quality Effect", Value: `€${qualityEffect.toFixed(2)}`, Percentage: `${(qualityEffect/finalPrice*100).toFixed(1)}%` },
        { Factor: "Balance Effect", Value: `€${balanceEffect.toFixed(2)}`, Percentage: `${(balanceEffect/finalPrice*100).toFixed(1)}%` },
        { Factor: "Final Price", Value: `€${finalPrice.toFixed(2)}`, Percentage: "100.0%" }
    ]);
    
    console.groupEnd();
    
    return finalPrice;
}

export function calculateOrderAmount(selectedWine, calculatedBasePrice, orderType) {
    const selectedOrderType = WINE_ORDER_TYPES[orderType];
    
    // Calculate price difference from base price (ratio of custom price to calculated base price)
    const priceDifference = selectedWine.customPrice / calculatedBasePrice;
    
    // Enhanced price adjustment with more aggressive formula for discounts
    let amountAdjustment = 1.0;
    
    if (priceDifference < 1) {
        // Lower price than base (discount)
        // Calculate percentage below base price (0 to 1 scale where 1 = 100% discount)
        const discountLevel = 1 - priceDifference;
        
        // Define discount threshold constants locally
        const SMALL_DISCOUNT_THRESHOLD = 0.1;   // 10% discount threshold
        const MEDIUM_DISCOUNT_THRESHOLD = 0.5;  // 50% discount threshold
        const LARGE_DISCOUNT_THRESHOLD = 0.9;   // 90% discount threshold
        const MAX_DISCOUNT_MODIFIER = 10;       // Maximum discount modifier (10x)
        
        // New formula that more closely matches our desired curve:
        // 10% discount -> 10% boost
        // 25% discount -> ~35% boost
        // 50% discount -> ~75% boost
        // 75% discount -> ~100% boost
        // 90% discount -> ~300% boost
        // 99% discount -> ~1000% boost
        if (discountLevel <= SMALL_DISCOUNT_THRESHOLD) {
            // Linear for small discounts: 1:1 boost up to 10%
            amountAdjustment = 1 + discountLevel;
        } else if (discountLevel <= MEDIUM_DISCOUNT_THRESHOLD) {
            // Progressive growth between 10-50% discount
            // 0.1 -> 1.1, 0.25 -> 1.35, 0.5 -> 1.75
            amountAdjustment = 1 + (discountLevel * (1 + discountLevel));
        } else if (discountLevel <= LARGE_DISCOUNT_THRESHOLD) {
            // Higher growth between 50-90% discount
            // 0.5 -> 1.75, 0.75 -> 2.0, 0.9 -> 4.0
            const factor = 1 + (discountLevel - MEDIUM_DISCOUNT_THRESHOLD) * 3;
            amountAdjustment = 1.75 + (discountLevel * factor);
        } else {
            // Extreme growth approaching infinity as discount approaches 100%
            // 0.9 -> 4.0, 0.99 -> 10.0, 0.999 -> 100.0
            amountAdjustment = 1 + (1 / (1 - discountLevel) * discountLevel * 10);
            
            // Cap at MAX_DISCOUNT_MODIFIER to avoid excessive orders
            amountAdjustment = Math.min(amountAdjustment, MAX_DISCOUNT_MODIFIER);
        }
    } else if (priceDifference > 1) {
        // Higher price than base (premium pricing)
        // Calculate percentage above base price (0 to infinity scale)
        const premiumLevel = priceDifference - 1;
        
        // Define premium pricing constants locally
        const PREMIUM_REDUCTION_FACTOR = 2.0;  // How aggressively premium prices reduce amount
        const MAX_PREMIUM_REDUCTION = 0.95;    // Maximum reduction (95%)
        
        // Premium pricing formula using arctangent
        amountAdjustment = 1 - Math.min((Math.atan(premiumLevel * PREMIUM_REDUCTION_FACTOR) / Math.PI) * MAX_PREMIUM_REDUCTION, MAX_PREMIUM_REDUCTION);
    }
    
    // Random base factor between MIN_BASE_FACTOR and MAX_BASE_FACTOR
    const { MIN_BASE_FACTOR, MAX_BASE_FACTOR, MIN_PRESTIGE_EFFECT, MAX_PRESTIGE_EFFECT } = ORDER_AMOUNT_FACTORS;
    const randomBaseFactor = MIN_BASE_FACTOR + Math.random() * (MAX_BASE_FACTOR - MIN_BASE_FACTOR);
    
    // Field prestige effect scales from MIN_PRESTIGE_EFFECT to MAX_PRESTIGE_EFFECT based on field prestige (0-1)
    const prestigeEffect = MIN_PRESTIGE_EFFECT + (MAX_PRESTIGE_EFFECT - MIN_PRESTIGE_EFFECT) * selectedWine.fieldPrestige;
    
    // Calculate base amount
    const baseAmount = Math.round(randomBaseFactor * prestigeEffect * amountAdjustment);
    
    // Apply order type multiplier
    const finalAmount = Math.max(1, Math.round(baseAmount * selectedOrderType.amountMultiplier));
    
    return {
        baseAmount,
        finalAmount,
        amountAdjustment,
        randomBaseFactor,
        prestigeEffect,
        orderTypeMultiplier: selectedOrderType.amountMultiplier,
        minPossibleBaseAmount: Math.round(MIN_BASE_FACTOR * prestigeEffect * amountAdjustment),
        maxPossibleBaseAmount: Math.round(MAX_BASE_FACTOR * prestigeEffect * amountAdjustment),
        minPrestigeEffect: MIN_PRESTIGE_EFFECT,
        maxPrestigeEffect: MAX_PRESTIGE_EFFECT,
        minBaseFactor: MIN_BASE_FACTOR,
        maxBaseFactor: MAX_BASE_FACTOR
    };
}

export function negotiateOrderPrice(selectedWine, calculatedBasePrice, orderType) {
    const selectedOrderType = WINE_ORDER_TYPES[orderType];
    
    // Calculate price difference ratio
    const priceDifference = selectedWine.customPrice / calculatedBasePrice;
    
    // Order price will typically be somewhat lower than the custom price (haggling)
    const { MIN_HAGGLING_FACTOR, MAX_HAGGLING_FACTOR } = PRICE_NEGOTIATION;
    const randomFactor = MIN_HAGGLING_FACTOR + Math.random() * (MAX_HAGGLING_FACTOR - MIN_HAGGLING_FACTOR);
    const negotiatedPrice = selectedWine.customPrice * randomFactor;
    
    // Apply order type price multiplier
    const finalPrice = negotiatedPrice * selectedOrderType.priceMultiplier;
    
    // Calculate possible final price range
    const minFinalPrice = selectedWine.customPrice * MIN_HAGGLING_FACTOR * selectedOrderType.priceMultiplier;
    const maxFinalPrice = selectedWine.customPrice * MAX_HAGGLING_FACTOR * selectedOrderType.priceMultiplier;
    
    return {
        priceDifference,
        negotiatedPrice,
        finalPrice,
        randomFactor, // Haggling factor
        minHagglingFactor: MIN_HAGGLING_FACTOR,
        maxHagglingFactor: MAX_HAGGLING_FACTOR,
        minFinalPrice,
        maxFinalPrice,
        priceMultiplier: selectedOrderType.priceMultiplier
    };
}

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

    const orderTypeKeys = Object.keys(WINE_ORDER_TYPES);
    
    // Get the selected wines that passed the chance check in shouldGenerateWineOrder
    const selectedWineInfos = shouldGenerateWineOrder.selectedWines || [];
    
    if (selectedWineInfos.length === 0) {
        console.log('[Wine Order] No wines selected for orders');
        return;
    }
    
    console.log(`[Wine Order] Generating ${selectedWineInfos.length} wine orders`);
    
    // Process each selected wine to create an order
    selectedWineInfos.forEach(wineInfo => {
        // Find the matching wine in inventory
        const selectedWine = bottledWines.find(wine => 
            wine.resource.name === wineInfo.name &&
            wine.vintage === wineInfo.vintage &&
            Math.abs(wine.quality - wineInfo.quality) < 0.001 // Float comparison
        );
        
        if (!selectedWine) {
            console.log(`[Wine Order] Could not find matching wine for ${wineInfo.name} (${wineInfo.vintage})`);
            return;
        }
        
        // Select random order type for this wine
        const selectedOrderTypeKey = orderTypeKeys[Math.floor(Math.random() * orderTypeKeys.length)];
        
        // Calculate base price for reference
        const calculatedBasePrice = calculateWinePrice(selectedWine.quality, selectedWine);
        
        // Calculate order amount and log details
        const amountCalculation = calculateOrderAmount(selectedWine, calculatedBasePrice, selectedOrderTypeKey);
        
        // Use the extracted function for price negotiation
        const priceCalculation = negotiateOrderPrice(selectedWine, calculatedBasePrice, selectedOrderTypeKey);
        
        // Use console groups for better organization
        console.group(`[Wine Order] ${selectedWine.resource.name}, Vintage ${selectedWine.vintage}`);
        
        // Basic wine info with pricing 
        logTable("Wine Information", {
            Wine: selectedWine.resource.name,
            Vintage: selectedWine.vintage,
            Quality: `${(selectedWine.quality * 100).toFixed(1)}%`,
            "Base Price": `€${calculatedBasePrice.toFixed(2)}`,
            "Custom Price": `€${selectedWine.customPrice.toFixed(2)}`,
            "Price Ratio": `${priceCalculation.priceDifference.toFixed(2)}x`
        });
        
        // Price adjustment explanation
        if (priceCalculation.priceDifference < 1) {
            console.log(`Lower price: increasing order amount by ${((amountCalculation.amountAdjustment - 1) * 100).toFixed(1)}%`);
        } else if (priceCalculation.priceDifference > 1) {
            console.log(`Higher price: decreasing order amount by ${((1 - amountCalculation.amountAdjustment) * 100).toFixed(1)}%`);
        } else {
            console.log(`Price matches base price, no adjustment needed`);
        }

        // Haggling and amount details
        logTable("Order Calculation", {
            "Haggling Factor": `${priceCalculation.randomFactor.toFixed(2)}x`,
            "Negotiated Price": `€${priceCalculation.negotiatedPrice.toFixed(2)}`,
            "Order Type": selectedOrderTypeKey,
            "Type Multiplier": `${priceCalculation.priceMultiplier}x`,
            "Final Price": `€${priceCalculation.finalPrice.toFixed(2)}`,
            "Amount": amountCalculation.finalAmount
        }, true); // collapsed

        // Amount calculation details
        logTable("Amount Calculation Details", {
            "Base Factor": `${amountCalculation.randomBaseFactor.toFixed(2)} (range: ${amountCalculation.minBaseFactor.toFixed(1)}-${amountCalculation.maxBaseFactor.toFixed(1)})`,
            "Prestige Effect": `${amountCalculation.prestigeEffect.toFixed(2)} (from prestige ${selectedWine.fieldPrestige.toFixed(2)})`,
            "Price Adjustment": amountCalculation.amountAdjustment.toFixed(2),
            "Base Amount": `${amountCalculation.baseAmount} (range: ${amountCalculation.minPossibleBaseAmount}-${amountCalculation.maxPossibleBaseAmount})`,
            "Final Amount": amountCalculation.finalAmount
        }, true); // collapsed
        
        console.groupEnd();
        
        const finalAmount = amountCalculation.finalAmount;

        const newOrder = {
            type: selectedOrderTypeKey,
            resourceName: selectedWine.resource.name,
            fieldName: selectedWine.fieldName,
            vintage: selectedWine.vintage,
            quality: selectedWine.quality,
            amount: finalAmount,
            wineOrderPrice: priceCalculation.finalPrice
        };

        addWineOrder(newOrder);
        addConsoleMessage(
            `Created ${newOrder.type} for ${newOrder.amount} bottles of ` +
            `${newOrder.resourceName}, Vintage ${newOrder.vintage}, ` +
            `Quality ${(newOrder.quality * 100).toFixed(0)}%, ` +
            `Price €${newOrder.wineOrderPrice.toFixed(2)}.`
        );
    });
    
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

    // If no matching wine or completely out of inventory, reject the order
    if (!bottledWine || bottledWine.amount <= 0) {
        addConsoleMessage('No matching inventory available to fulfill this order.');
        return false;
    }

    // Calculate how many bottles we can actually sell
    const sellAmount = Math.min(order.amount, bottledWine.amount);
    
    // Calculate the actual selling price based on available inventory
    const totalSellingPrice = order.wineOrderPrice * sellAmount;
    
    console.log(`[Wine Sale] Order details:`, {
        wineOrderPrice: order.wineOrderPrice,
        requestedAmount: order.amount,
        availableAmount: bottledWine.amount,
        sellingAmount: sellAmount,
        total: totalSellingPrice
    });

    if (inventoryInstance.removeResource(
        bottledWine.resource, 
        sellAmount, 
        'Bottles', 
        bottledWine.vintage, 
        bottledWine.storage
    )) {
        // Determine if this is a partial or full order
        const isPartial = sellAmount < order.amount;
        
        addConsoleMessage(
            `Sold ${sellAmount} bottles of ${order.resourceName}, ` +
            `Vintage ${order.vintage}, ` +
            `Quality ${(order.quality * 100).toFixed(0)}% ` +
            `for €${totalSellingPrice.toFixed(2)}` +
            (isPartial ? ` (partial order - ${sellAmount}/${order.amount} bottles)` : "")
        );

        addTransaction('Income', 'Wine Sale', totalSellingPrice);
        setPrestigeHit(getPrestigeHit() + totalSellingPrice / 10000);
        calculateRealPrestige();

        // Remove the order after successful transaction
        if (!removeWineOrder(orderIndex)) {
            addConsoleMessage('Error removing wine order.');
            return false;
        }

        // Save inventory after successful transaction
        inventoryInstance.save();
        
        // Update the wine cellar display
        displayWineCellarInventory();
        
        return true;
    }
    return false;
}

export function shouldGenerateWineOrder() {
    const winesWithPrices = inventoryInstance.getItemsByState('Bottles').filter(wine => wine.customPrice > 0);

    if (winesWithPrices.length === 0) {
        return false;
    }

    const companyPrestige = calculateRealPrestige();
    const { MIN_BASE_CHANCE, MID_PRESTIGE_CHANCE, MAX_BASE_CHANCE, PRESTIGE_THRESHOLD, MIN_DIMINISHING_FACTOR } = ORDER_GENERATION;
    let baseChance;

    if (companyPrestige <= PRESTIGE_THRESHOLD) {
        baseChance = MIN_BASE_CHANCE + (companyPrestige / PRESTIGE_THRESHOLD) * (MID_PRESTIGE_CHANCE - MIN_BASE_CHANCE);
    } else {
        baseChance = MID_PRESTIGE_CHANCE + (Math.atan((companyPrestige - PRESTIGE_THRESHOLD) / 200) / Math.PI) * (MAX_BASE_CHANCE - MID_PRESTIGE_CHANCE);
    }

    const diminishingFactor = Math.max(0.1, 1 / Math.sqrt(winesWithPrices.length));

    let anyWineGetsOrder = false;
    shouldGenerateWineOrder.selectedWines = [];

    for (const wine of winesWithPrices) {
        const basePrice = calculateWinePrice(wine.quality, wine, true);
        if (basePrice <= 0) continue;

        const deviation = (wine.customPrice - basePrice) / basePrice;
        let priceModifier = 1.0;

        if (deviation < 0) {
            const discountLevel = Math.abs(deviation);

            if (discountLevel <= 0.1) {
                priceModifier = 1 + discountLevel;
            } else if (discountLevel <= 0.5) {
                priceModifier = 1.1 + discountLevel * 1.8;
            } else if (discountLevel <= 0.9) {
                priceModifier = 2 + (discountLevel - 0.5) * 5;
            } else {
                priceModifier = 4 + (discountLevel - 0.9) * 60;
                priceModifier = Math.min(priceModifier, 10);
            }
        } else {
            priceModifier = 1 - Math.min(deviation * 1.4, 0.7);
        }

        const wineChance = Math.min(baseChance * priceModifier * diminishingFactor, 0.99);
        const randomValue = Math.random();
        const wineGetsOrder = randomValue < wineChance;

        if (wineGetsOrder) {
            anyWineGetsOrder = true;
            shouldGenerateWineOrder.selectedWines.push({
                name: wine.resource.name,
                vintage: wine.vintage,
                quality: wine.quality,
                fieldName: wine.fieldName
            });
        }
    }

    return anyWineGetsOrder;
}
