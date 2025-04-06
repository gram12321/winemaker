import { loadInventory } from '../database/adminFunctions.js';
import { 
    calculateNearestArchetype, 
    processWineObject,
    validateWineObject,
    findBestArchetypeMatch,
    testWineAgainstArchetype 
} from './archetypeUtils.js';
import { archetypes } from '../constants/archetypes.js';

export const baseBalancedRanges = {
    acidity: [0.4, 0.6],
    aroma: [0.3, 0.7],
    body: [0.4, 0.8],
    spice: [0.35, 0.65],
    sweetness: [0.4, 0.6],
    tannins: [0.35, 0.65]
};

const balanceAdjustments = {
    acidity_down: [
        { 
            target: "sweetness_range",
            formula: (diff) => diff * 0.5
        },
        {
            target: "spice_penalty",
            penaltyMod: 1.5,
            formula: (diff) => 1 + Math.pow(diff, 2)
        }
    ],
    acidity_up: [
        { 
            target: "sweetness_range",
            formula: (diff) => diff * -0.5  // Opposite of down's 0.5
        },
        {
            target: "spice_penalty",
            penaltyMod: 0.67,  // Inverse of down's 1.5
            formula: (diff) => 1 - (Math.pow(diff, 2) * 0.5)  // Reduced penalty
        }
    ],
    aroma_up: [
        {
            target: "body_range",
            formula: (diff) => diff * 0.3
        },
        {
            target: "spice_penalty",
            penaltyMod: 1.3,
            formula: (diff) => 1 + Math.pow(diff, 1.2)
        }
    ],
    aroma_down: [
        {
            target: "body_range",
            formula: (diff) => diff * -0.3
        },
        {
            target: "spice_penalty",
            penaltyMod: 0.77,  // Inverse of up's 1.3
            formula: (diff) => 1 - (Math.pow(diff, 1.2) * 0.5)  // Reduced penalty
        }
    ],
    body_up: [
        { 
            target: "spice_range",
            formula: (diff) => diff * 0.5
        },
        { 
            target: "tannins_range",
            formula: (diff) => diff * 0.6
        },
        {
            target: "aroma_penalty",
            penaltyMod: 1.5,
            formula: (diff) => 1 + Math.pow(diff, 1.5)
        }
    ],
    body_down: [
        { 
            target: "spice_range",
            formula: (diff) => diff * -0.5
        },
        { 
            target: "tannins_range",
            formula: (diff) => diff * -0.6
        },
        {
            target: "aroma_penalty",
            penaltyMod: 0.67,  // Inverse of up's 1.5
            formula: (diff) => 1 - (Math.pow(diff, 1.5) * 0.5)  // Reduced penalty
        }
    ],
    sweetness_up: [
        { 
            target: "acidity_range",
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
    sweetness_down: [
        { 
            target: "acidity_range",
            formula: (diff) => diff * -0.5
        },
        {
            target: "spice_penalty",
            penaltyMod: 1,  // Same as up's base multiplier
            formula: (diff) => {
                let steps = Math.floor(diff * 10);
                let penalty = 1;
                for (let i = 0; i < steps; i++) {
                    penalty *= 0.8;  // Decrease by 20% each step (opposite of up's increase)
                }
                return penalty;
            }
        }
    ],
    tannins_up: [
        { 
            target: "body_range",
            formula: (diff) => diff * 0.5
        },
        { 
            target: "aroma_range",
            formula: (diff) => diff * 0.4
        },
        {
            target: "sweetness_penalty",
            penaltyMod: 2,
            formula: (diff) => 1 + Math.pow(diff, 2)
        }
    ],
    tannins_down: [
        { 
            target: "body_range",
            formula: (diff) => diff * -0.5
        },
        { 
            target: "aroma_range",
            formula: (diff) => diff * -0.4
        },
        {
            target: "sweetness_penalty",
            penaltyMod: 0.5,  // Inverse of up's 2
            formula: (diff) => 1 - (Math.pow(diff, 2) * 0.5)  // Reduced penalty
        }
    ],
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
    spice_up: [
        {
            target: "body_penalty",
            penaltyMod: 0.5,  // Inverse of down's 2
            formula: (diff) => 1 - (Math.pow(diff, 1.5) * 0.5)  // Reduced penalty
        },
        {
            target: "aroma_penalty",
            penaltyMod: 0.67,  // Inverse of down's 1.5
            formula: (diff) => 1 - (Math.pow(diff, 1.3) * 0.5)  // Reduced penalty
        }
    ]
};

// Synergy bonuses that enhance the balance score
const synergyBonuses = {
    acidityTannins: {
        characteristics: ["acidity", "tannins"],
        // Both need to be high (above 0.7) for bonus
        condition: (wine) => wine.acidity > 0.7 && wine.tannins > 0.7,
        // Bonus increases based on how high both values are
        bonus: (wine) => (wine.acidity + wine.tannins - 1.4) * 0.1
    },
    bodySpice: {
        characteristics: ["body", "spice"],
        // Both need to be between 0.6-0.8 for perfect harmony
        condition: (wine) => wine.body >= 0.6 && wine.body <= 0.8 && 
                           wine.spice >= 0.6 && wine.spice <= 0.8,
        // Bonus based on how close they are to each other
        bonus: (wine) => 0.1 * (1 - Math.abs(wine.body - wine.spice))
    },
    aromaBalance: {
        characteristics: ["aroma", "body", "sweetness"],
        // Aroma should be slightly higher than body, sweetness should be moderate
        condition: (wine) => wine.aroma > wine.body && 
                           wine.sweetness >= 0.4 && wine.sweetness <= 0.6,
        // Bonus for perfect ratios
        bonus: (wine) => {
            const aromaBodyRatio = wine.aroma / wine.body;
            return aromaBodyRatio >= 1.1 && aromaBodyRatio <= 1.3 ? 0.15 : 0.05;
        }
    }
};

// Function to calculate wine balance and archetype info - moved from wineInfoOverlay.js
export function calculateWineBalance(wine) {
    const processedWine = processWineObject(wine);
    const { archetype, distance, qualifies } = calculateNearestArchetype(processedWine);
    const score = balanceCalculator(processedWine, archetype);

    return {
        score: score,
        archetype: archetype.name,
        qualifies: qualifies,
        distance: distance
    };
}

export function balanceCalculator(wine, archetype) {
    // Process wine object to ensure consistent data types
    const processedWine = processWineObject(wine);
    
    // Validate wine object
    try {
        validateWineObject(processedWine);
    } catch (e) {
        return 0;
    }

    // Find best matching archetype
    const bestMatch = findBestArchetypeMatch(processedWine);

    // Calculate synergy bonus
    let synergyBonus = 0;
    for (const synergy of Object.values(synergyBonuses)) {
        if (synergy.condition(processedWine)) {
            synergyBonus += synergy.bonus(processedWine);
        }
    }
    synergyBonus = Math.min(synergyBonus, 0.2);

    // Calculate dynamic balance
    let dynamicBalance = dynamicBalanceScore(processedWine, baseBalancedRanges, synergyBonus);
    
    // Determine final score
    let finalScore;
    if (bestMatch.qualifies && bestMatch.archetype) {
        finalScore = Math.max(bestMatch.score, dynamicBalance);
    } else {
        finalScore = dynamicBalance;
    }
    
    return calculateSteppedBalance(finalScore);
}

function calculateSteppedBalance(score) {
    if (score < 0.4) {
        // Polynomial curve for low scores: x² * 1.5
        return score * score * 1.5;
        // 0.0 → 0.000
        // 0.1 → 0.015
        // 0.2 → 0.060
        // 0.3 → 0.135
        // 0.4 → 0.240
    } else if (score < 0.7) {
        // Logarithmic scaling for middle range
        return 0.24 + (Math.log(1 + (score - 0.4) * 3.33) * 0.3);
        // 0.4 → 0.240
        // 0.5 → 0.370
        // 0.6 → 0.480
        // 0.7 → 0.560
    } else if (score < 0.9) {
        // Linear scaling for good scores
        return 0.56 + (score - 0.7) * 1.5;
        // 0.7 → 0.560
        // 0.8 → 0.710
        // 0.9 → 0.860
    } else if (score < 0.95) {
        // Exponential for very good scores
        return 0.86 + (score - 0.9) * 2;
        // 0.90 → 0.860
        // 0.95 → 0.960
    } else if (score < 0.99) {
        // Logistic curve for excellent scores
        return 0.96 + (score - 0.95) * 0.8;
        // 0.95 → 0.960
        // 0.99 → 0.992
    } else {
        // Sigmoid for near-perfect scores
        return 0.99 + (1 - Math.exp(-(score - 0.99) * 10)) * 0.01;
        // 0.99 → 0.992
        // 1.00 → 1.000
    }
}

export function applyRangeAdjustments(wine, baseBalancedRanges) {
    const Characteristics = [
        'sweetness',
        'acidity',
        'tannins',
        'aroma',
        'body',
        'spice'
    ];

    const characteristics = {};
    Characteristics.forEach(char => {
        if (typeof wine[char] === 'number') {
            characteristics[char] = wine[char];
        }
    });

    let adjustedRanges = structuredClone(baseBalancedRanges);

    // Process only valid characteristics
    for (const characteristic in characteristics) {
        const [baseMin, baseMax] = baseBalancedRanges[characteristic];
        const baseMidpoint = (baseMin + baseMax) / 2;
        const value = characteristics[characteristic];
        const diff = value - baseMidpoint;

        if (diff !== 0) {
            let adjustmentKey = characteristic + (diff > 0 ? "_up" : "_down");
            if (!balanceAdjustments[adjustmentKey]) continue;

            for (const adjustment of balanceAdjustments[adjustmentKey]) {
                let targetCharacteristic = adjustment.target.replace("_range", "");
                if (!baseBalancedRanges[targetCharacteristic]) continue;

                let shiftAmount = adjustment.formula(Math.abs(diff));
                adjustedRanges[targetCharacteristic][0] += shiftAmount;
                adjustedRanges[targetCharacteristic][1] += shiftAmount;
            }
        }
    }

    return adjustedRanges;
}

export function applyPenaltyAdjustments(wine) {
    let penaltyMultipliers = {};

    for (const characteristic in wine) {
        // Skip if characteristic isn't in baseBalancedRanges
        if (!baseBalancedRanges[characteristic]) continue;

        let diff = wine[characteristic] - ((baseBalancedRanges[characteristic][0] + baseBalancedRanges[characteristic][1]) / 2);

        if (Math.abs(diff) > 0.001) { // Add small threshold to avoid floating point issues
            let adjustmentKey = characteristic + (diff > 0 ? "_up" : "_down");
            if (!balanceAdjustments[adjustmentKey]) continue;

            for (const adjustment of balanceAdjustments[adjustmentKey]) {
                let target = adjustment.target;
                if (!target.includes("_penalty")) continue;

                let penaltyMod = adjustment.penaltyMod || 1;
                let shiftAmount = adjustment.formula(Math.abs(diff)); // Use absolute diff

                if (!penaltyMultipliers[target]) penaltyMultipliers[target] = 1;
                penaltyMultipliers[target] *= shiftAmount * penaltyMod;
            }
        }
    }

    return penaltyMultipliers;
}

function dynamicBalanceScore(wine, baseBalancedRanges, synergyBonus) {
    let adjustedRanges = applyRangeAdjustments(wine, baseBalancedRanges);
    let penaltyMultipliers = applyPenaltyAdjustments(wine);
    let totalDeduction = 0;

    for (const characteristic in wine) {
        if (!adjustedRanges[characteristic]) continue;

        const [min, max] = adjustedRanges[characteristic];
        const midpoint = (min + max) / 2;
        const value = wine[characteristic];

        let insideRangeDeduction = 0;
        let outOfRangeDeduction = 0;

        if (value >= min && value <= max) {
            insideRangeDeduction = Math.abs(value - midpoint);
        } else {
            insideRangeDeduction = Math.abs(value < min ? min - midpoint : max - midpoint);
            
            let outsideDistance = value < min ? min - value : value - max;
            let steps = Math.ceil(outsideDistance * 10);
            
            for (let i = 0; i < steps; i++) {
                let stepSize = Math.min(0.1, outsideDistance - (i * 0.1));
                outOfRangeDeduction += stepSize * Math.pow(2, i + 1);
            }
        }

        let rawDeduction = insideRangeDeduction + outOfRangeDeduction;

        // Apply penalties
        let penaltyKey = characteristic + "_penalty";
        let adjustmentPenalty = penaltyMultipliers[penaltyKey] || 1;
        rawDeduction *= adjustmentPenalty;

        // Apply synergy reduction to deductions
        if (synergyBonus > 0) {
            rawDeduction *= (1 - synergyBonus);
        }

        // Apply exponential decay to the deduction
        let normalizedDeduction = 1 - Math.exp(-rawDeduction);
        totalDeduction += normalizedDeduction;
    }

    return 1 - (totalDeduction / Object.keys(wine).length);
}

export { calculateNearestArchetype, dynamicBalanceScore };
