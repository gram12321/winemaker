export function balanceCalculator(wine, archetype) {
    let debugInfo = {
        scores: {},
        adjustedRanges: {},
        deductions: {},  // Changed from penalties to deductions
        reason: ""
    };

    // Calculate dynamic balance first (always applies)
    let { score: dynamicBalance, adjustedRanges, deductions } = dynamicBalanceScore(wine, baseBalancedRanges, true);  // Changed from penalties to deductions
    debugInfo.scores.dynamic = dynamicBalance;
    debugInfo.adjustedRanges = adjustedRanges;
    debugInfo.deductions = deductions;  // Changed from penalties to deductions

    // Calculate archetype scores if wine qualifies
    let archetypeBalance = 0;
    if (qualifiesForArchetype(wine, archetype)) {
        let midpointScore = distanceScore(wine, archetype);
        let groupBalance = balanceScore(wine, archetype);
        archetypeBalance = calculateSteppedBalance((midpointScore + groupBalance) / 2);
        debugInfo.scores.archetype = archetypeBalance;
        debugInfo.reason = "Wine qualifies for archetype";
    } else {
        debugInfo.reason = "Wine does not qualify for archetype";
    }

    // Apply stepped balance calculation
    let dynamicScore = calculateSteppedBalance(dynamicBalance);
    debugInfo.scores.dynamicFinal = dynamicScore;

    // Final score calculation
    let finalScore = qualifiesForArchetype(wine, archetype) ?
        (archetypeBalance * 0.6) + (dynamicScore * 0.4) :
        dynamicScore;

    // Debug logging
    console.log("=== Wine Balance Analysis ===");
    console.log("Status:", debugInfo.reason);
    
    // More detailed score breakdown
    console.log("\nScore Breakdown:");
    console.log("Dynamic Balance:");
    console.log("  Raw Score:", debugInfo.scores.dynamic.toFixed(3));
    console.log("  After Stepped Calculation:", debugInfo.scores.dynamicFinal.toFixed(3));
    if (debugInfo.scores.archetype) {
        console.log("Archetype Score:", debugInfo.scores.archetype.toFixed(3));
    }

    // Detailed range and deduction analysis
    console.log("\nCharacteristic Analysis:");
    for (const [characteristic, deduction] of Object.entries(debugInfo.deductions)) {  // Changed from penalties to deductions
        console.log(`\n${characteristic.toUpperCase()}:`);
        console.log(`  Value: ${deduction.value.toFixed(3)}`);
        console.log(`  Acceptable Range: [${deduction.range[0].toFixed(2)} - ${deduction.range[1].toFixed(2)}]`);
        console.log(`  Midpoint: ${deduction.midpoint.toFixed(6)}`);  // Show more decimals
        console.log("  Deductions:");
        console.log(`    Within Range: ${deduction.insideRangeDeduction.toFixed(6)}`);
        if (deduction.outOfRangeDeduction > 0) {
            console.log(`    Outside Range: ${deduction.outOfRangeDeduction.toFixed(3)}`);
        }
        if (deduction.adjustmentPenalty && deduction.adjustmentPenalty !== 1) {
            console.log(`    Additional Penalties:`);
            console.log(`      Base Deduction: ${(deduction.insideRangeDeduction + deduction.outOfRangeDeduction).toFixed(3)}`);
            console.log(`      Penalty Multiplier: ${deduction.adjustmentPenalty.toFixed(3)}x`);
            console.log(`      After Penalties: ${((deduction.insideRangeDeduction + deduction.outOfRangeDeduction) * deduction.adjustmentPenalty).toFixed(3)}`);
        }
        console.log(`  Total Deduction: ${deduction.totalDeduction.toFixed(3)}`);
    }

    console.log(`\nFinal Score: ${finalScore.toFixed(3)}`);
    console.log("========================");

    return finalScore;
}

function calculateSteppedBalance(score) {
    if (score < 0.7) {
        // Linear with low multiplier for poor scores
        return score * 0.8;
    } else if (score < 0.9) {
        // Steeper linear for good scores
        return 0.56 + (score - 0.7) * 1.5;
    } else if (score < 0.95) {
        // Exponential for very good scores
        return 0.86 + (score - 0.9) * 2;
    } else if (score < 0.99) {
        // Logistic curve for excellent scores
        return 0.96 + (score - 0.95) * 0.8;
    } else {
        // Final sigmoid for near-perfect scores
        return 0.99 + (1 - Math.exp(-(score - 0.99) * 10)) * 0.01;
    }
}

function distanceScore(wine, archetype) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const characteristic in archetype.idealRanges) {
        const [min, max] = archetype.idealRanges[characteristic];
        const midpoint = (min + max) / 2;  // Fixed: removed 'and', replaced with '+'
        const value = wine[characteristic];
        const importance = archetype.importance[characteristic] || 1;

        let distance = Math.abs(value - midpoint) / (max - min); // Normalize distance
        let score = Math.pow(1 - Math.pow(distance, 2), importance); // Exponential decay

        totalScore += score * importance;
        totalWeight += importance;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0; // Normalize to 0-1
}

function balanceScore(wine, archetype) {
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const group of archetype.balanceGroups) {
        let values = group.map(char => wine[char]).filter(v => v !== undefined);
        if (values.length < 2) continue; // Skip groups with only 1 characteristic

        let weight = group.reduce((sum, char) => sum + (archetype.importance[char] || 1), 0) / group.length;  // Fixed: added dot before reduce

        let pairwiseDistances = [];

        // Compute all pairwise distances
        for (let i = 0; i < values.length; i++) {
            for (let j = i + 1; j < values.length; j++) {
                let difference = Math.abs(values[i] - values[j]); // Absolute difference
                pairwiseDistances.push(difference);
            }
        }

        let avgDistance = pairwiseDistances.reduce((a, b) => a + b, 0) / pairwiseDistances.length;
        let score = Math.pow(1 - Math.pow(avgDistance, 2), weight); // Exponential decay

        totalScore += score * weight;
        totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0; // Normalize
}

function qualifiesForArchetype(wine, archetype) {
    for (const characteristic in archetype.idealRanges) {
        const [min, max] = archetype.idealRanges[characteristic];
        if (wine[characteristic] < min || wine[characteristic] > max) {
            return false; // Reject immediately
        }
    }
    return true;
}

export const archetypes = {
    sweetWine: {
      name: "Sweet Wine",
      idealRanges: {
        sweetness: [0.8, 1.0],  
        acidity: [0.8, 1.0],    
        tannins: [0.3, 0.7],  
        aroma: [0.3, 0.7],     
        body: [0.3, 0.7],       
        spice: [0.3, 0.7]       
      },
      importance: { 
        sweetness: 1.0, 
        acidity: 1.0,
        tannins: 0.5,
        aroma: 0.5,
        body: 0.5,
        spice: 0.5
      },
      balanceGroups: [
        ["sweetness", "acidity"],  // These must be in balance
        ["tannins", "aroma", "body", "spice"]  // These should be similar
      ]
    },
  
    boldRed: {
      name: "Bold Red",
      idealRanges: {
        sweetness: [0.0, 0.4],  
        acidity: [0.3, 0.7],    
        tannins: [0.7, 1.0],  
        aroma: [0.3, 0.7],     // Need to match with acidity
        body: [0.7, 1.0],       
        spice: [0.7, 1.0]       
      },
      importance: { 
        sweetness: 0.5, 
        acidity: 0.8,
        tannins: 1.0,
        aroma: 0.7,
        body: 1.0,
        spice: 0.7
      },
      balanceGroups: [
        ["tannins", "body", "spice"],  // These must be similar
        ["acidity", "aroma"]  // These should not be too far apart
      ]
    }
  };


  const baseBalancedRanges = {
    sweetness: [0.4, 0.6], 
    acidity: [0.3, 0.7], 
    tannins: [0.3, 0.7], 
    body: [0.4, 0.8], 
    spice: [0.2, 0.6], 
    aroma: [0.3, 0.7]
};


function applyRangeAdjustments(wine, baseBalancedRanges) {
    let adjustedRanges = structuredClone(baseBalancedRanges);

    for (const characteristic in wine) {
        // Calculate distance from midpoint of base range
        const [baseMin, baseMax] = baseBalancedRanges[characteristic];
        const baseMidpoint = (baseMin + baseMax) / 2;
        const diff = wine[characteristic] - baseMidpoint;

        if (diff !== 0) {
            let adjustmentKey = characteristic + (diff > 0 ? "_up" : "_down");
            if (!balanceAdjustments[adjustmentKey]) continue;

            for (const adjustment of balanceAdjustments[adjustmentKey]) {
                let targetCharacteristic = adjustment.target.replace("_range", "");
                if (!baseBalancedRanges[targetCharacteristic]) continue;

                // Calculate range adjustment
                let shiftAmount = adjustment.formula(Math.abs(diff));
                
                // Apply shift to both min and max of target range
                adjustedRanges[targetCharacteristic][0] += shiftAmount;
                adjustedRanges[targetCharacteristic][1] += shiftAmount;
            }
        }
    }

    return adjustedRanges;
}

function applyPenaltyAdjustments(wine) {
    let penaltyMultipliers = {};

    for (const characteristic in wine) {
        let diff = wine[characteristic] - ((baseBalancedRanges[characteristic][0] + baseBalancedRanges[characteristic][1]) / 2);

        if (diff !== 0) {
            let adjustmentKey = characteristic + (diff > 0 ? "_up" : "_down");
            if (!balanceAdjustments[adjustmentKey]) continue;

            for (const adjustment of balanceAdjustments[adjustmentKey]) {
                let target = adjustment.target;
                if (!target.includes("_penalty")) continue; // Only adjust penalties

                let penaltyMod = adjustment.penaltyMod || 1;
                let shiftAmount = adjustment.formula(diff);

                if (!penaltyMultipliers[target]) penaltyMultipliers[target] = 1;
                penaltyMultipliers[target] *= shiftAmount * penaltyMod; // Apply penalty multiplier
            }
        }
    }

    return penaltyMultipliers;
}

function dynamicBalanceScore(wine, baseBalancedRanges, debug = false) {
    let adjustedRanges = applyRangeAdjustments(wine, baseBalancedRanges);
    let penaltyMultipliers = applyPenaltyAdjustments(wine);
    let deductions = {};
    let totalDeduction = 0;

    for (const characteristic in wine) {
        if (!adjustedRanges[characteristic]) continue;

        const [min, max] = adjustedRanges[characteristic];
        const midpoint = (min + max) / 2;
        const value = wine[characteristic];

        // Calculate deductions
        let insideRangeDeduction = 0;
        let outOfRangeDeduction = 0;

        if (value >= min && value <= max) {
            // Inside range: simple linear distance from midpoint (without normalization)
            insideRangeDeduction = Math.abs(value - midpoint);
        } else {
            // Inside range portion (full distance from midpoint to boundary)
            insideRangeDeduction = Math.abs(value < min ? min - midpoint : max - midpoint);
            
            // Outside range portion with exponential scaling
            let outsideDistance = value < min ? min - value : value - max;
            let steps = Math.ceil(outsideDistance * 10); // Split into 0.1 increments
            
            for (let i = 0; i < steps; i++) {
                let stepSize = Math.min(0.1, outsideDistance - (i * 0.1));
                outOfRangeDeduction += stepSize * Math.pow(2, i + 1);
            }
        }

        if (characteristic === 'acidity') {
            console.log('Raw calculation for acidity:');
            console.log('value:', value);
            console.log('midpoint:', midpoint);
            console.log('abs(value - midpoint):', Math.abs(value - midpoint));
            console.log('raw insideRangeDeduction:', insideRangeDeduction);
        }

        let characteristicDeduction = insideRangeDeduction + outOfRangeDeduction;

        // Apply penalties to the deductions
        let penaltyKey = characteristic + "_penalty";
        let adjustmentPenalty = penaltyMultipliers[penaltyKey] || 1;
        
        // Apply penalty multiplier to the total deduction
        characteristicDeduction *= adjustmentPenalty;

        if (debug) {
            deductions[characteristic] = {
                value,
                range: [min, max],
                midpoint,
                insideRangeDeduction,
                outOfRangeDeduction,
                adjustmentPenalty, // Add penalty multiplier to debug info
                totalDeduction: characteristicDeduction
            };
        }

        totalDeduction += characteristicDeduction;
    }

    console.log("\nFinal Score Calculation:");
    console.log("Total Deductions by Characteristic:");
    for (const characteristic in deductions) {
        console.log(`  ${characteristic}: ${deductions[characteristic].totalDeduction.toFixed(3)}`);
    }
    console.log(`Sum of all deductions: ${totalDeduction.toFixed(3)}`);
    console.log(`Number of characteristics: ${Object.keys(wine).length}`);
    console.log(`Average deduction: ${(totalDeduction / Object.keys(wine).length).toFixed(3)}`);
    
    // Calculate final score (start at 1.0 and subtract average deduction)
    let finalScore = Math.max(0, 1 - (totalDeduction / Object.keys(wine).length));
    console.log(`Final Score: 1.0 - ${(totalDeduction / Object.keys(wine).length).toFixed(3)} = ${finalScore.toFixed(3)}`);

    return debug ? {
        score: finalScore,
        adjustedRanges,
        deductions
    } : finalScore;
}

// Update balance adjustments with stronger range modifications
const balanceAdjustments = {
    // Primary Taste Balance
    sweetness_up: [
        { 
            target: "acidity_range",
            multiplier: 0.5,  // Shift acidity range up by half of sweetness's distance from midpoint
            formula: (diff) => diff * 0.5  // Simple linear adjustment
        },
        {
            target: "spice_penalty",
            penaltyMod: 1,  // Base multiplier
            formula: (diff) => {
                // For every 0.1 above midpoint, increase penalty exponentially
                let steps = Math.floor(diff * 10);  // Convert to steps of 0.1
                let penalty = 1;  // Start with no penalty
                
                for (let i = 0; i < steps; i++) {
                    penalty *= 1.2;  // Increase by 20% each 0.1 step
                }
                
                return penalty;
            }
        }
    ],
    acidity_down: [
        { 
            target: "sweetness_range",
            multiplier: 0.5,
            formula: (diff) => diff * 0.5
        },
        {
            target: "spice_penalty",
            penaltyMod: 1.5,
            formula: (diff) => 1 + Math.pow(diff, 2)
        }
    ],

    // Structure Balance
    body_up: [
        { 
            target: "spice_range",
            multiplier: 0.5,
            formula: (diff) => diff * 0.5
        },
        { 
            target: "tannins_range",
            multiplier: 0.6,  // Slightly stronger effect on tannins
            formula: (diff) => diff * 0.6
        },
        {
            target: "aroma_penalty",
            penaltyMod: 1.5,
            formula: (diff) => 1 + Math.pow(diff, 1.5)
        }
    ],
    tannins_up: [
        { 
            target: "body_range",
            multiplier: 0.5,
            formula: (diff) => diff * 0.5
        },
        { 
            target: "aroma_range",
            multiplier: 0.4,  // Slightly weaker effect on aroma
            formula: (diff) => diff * 0.4
        },
        {
            target: "sweetness_penalty",
            penaltyMod: 2,
            formula: (diff) => 1 + Math.pow(diff, 2)
        }
    ],

    // Aromatics Balance
    spice_down: [
        {
            target: "body_penalty",
            penaltyMod: 2,
            formula: (diff) => 1 + Math.pow(diff, 1.5)
        },
        {
            target: "aroma_penalty",
            penaltyMod: 1.5,
            formula: (diff) => 1 + Math.pow(diff, 1.3)
        }
    ],
    aroma_up: [
        {
            target: "body_range",
            multiplier: 0.3,
            formula: (diff) => diff * 0.3
        },
        {
            target: "spice_penalty",
            penaltyMod: 1.3,
            formula: (diff) => 1 + Math.pow(diff, 1.2)
        }
    ]
};
