import { archetypes } from './../constants/archetypes.js';
import { loadInventory } from '../database/adminFunctions.js';

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
            formula: (diff) => diff * -0.3  // Opposite of up's 0.3
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
            formula: (diff) => diff * -0.5  // Opposite of up's 0.5
        },
        { 
            target: "tannins_range",
            formula: (diff) => diff * -0.6  // Opposite of up's 0.6
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
            formula: (diff) => diff * -0.5  // Opposite of up's 0.5
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
            formula: (diff) => diff * -0.5  // Opposite of up's 0.5
        },
        { 
            target: "aroma_range",
            formula: (diff) => diff * -0.4  // Opposite of up's 0.4
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

// Add new constant for synergy definitions
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


// Update qualifiesForArchetype function to handle new requirement structure
function qualifiesForArchetype(wine, archetype) {
    if (!wine || !archetype.requirements) {
        return true;
    }
    const reqs = archetype.requirements;

    // Build requirements object for validation
    const requirements = {
        // Basic requirements
        requiredGrapes: archetype.requirements?.requiredGrapes ?? 'not required',
        requiredColor: archetype.requirements?.requiredColor ?? 'not required',
        minimumQuality: archetype.requirements?.minimumQuality ?? 'not required',
        minimumVintage: archetype.requirements?.minimumVintage ?? 'not required',
        minimumPrestige: archetype.requirements?.minimumPrestige ?? 'not required',
        oxidationRange: archetype.requirements?.oxidationRange ? 
            `${archetype.requirements.oxidationRange[0]}-${archetype.requirements.oxidationRange[1]}` : 
            'not required',
        ripenessRange: archetype.requirements?.ripenessRange ?
            `${archetype.requirements.ripenessRange[0]}-${archetype.requirements.ripenessRange[1]}` :
            'not required',
        
        // Processing requirements
        requireEcological: archetype.processingReqs?.requireEcological ?? 'not required',
        allowedMethods: archetype.processingReqs?.allowedMethods?.join(', ') ?? 'not required',
        
        // Characteristic ranges
        ...Object.fromEntries(
            Object.entries(archetype.characteristics.idealRanges)
            .map(([key, [min, max]]) => [key, `${min}-${max}`])
        )
    };

    // Check all requirements
    if (reqs.requiredGrapes && (!wine.resource || !reqs.requiredGrapes.includes(wine.resource.name))) {
        return false;
    }

    // Check grape color
    if (reqs.requiredColor && (!wine.resource || wine.resource.grapeColor !== reqs.requiredColor)) {
        return false;
    }

    // Check quality requirement
    if (reqs.minimumQuality && wine.quality < reqs.minimumQuality) {
        return false;
    }

    // Check vintage requirement
    if (reqs.minimumVintage && wine.vintage < reqs.minimumVintage) {
        return false;
    }

    // Check field prestige
    if (reqs.minimumPrestige && wine.fieldPrestige < reqs.minimumPrestige) {
        return false;
    }

    // Check oxidation range
    if (reqs.oxidationRange) {
        const [minOx, maxOx] = reqs.oxidationRange;
        if (wine.oxidation < minOx || wine.oxidation > maxOx) {
            return false;
        }
    }

    // Check ripeness range
    if (reqs.ripenessRange) {
        const [minRipe, maxRipe] = reqs.ripenessRange;
        if (wine.ripeness < minRipe || wine.ripeness > maxRipe) {
            return false;
        }
    }

    // Check processing requirements
    if (archetype.processingReqs) {
        if (archetype.processingReqs.requireEcological) {
            if (!wine.fieldSource || wine.fieldSource.conventional !== 'Ecological') {
                return false;
            }
        }

        if (archetype.processingReqs.allowedMethods) {
            if (!archetype.processingReqs.allowedMethods.includes(wine.crushingMethod)) {
                return false;
            }
        }
    }

    // Check characteristic ranges
    for (const [trait, [min, max]] of Object.entries(archetype.characteristics.idealRanges)) {
        if (wine[trait] < min || wine[trait] > max) {
            return false;
        }
    }

    return true;
}

function validateWineObject(wine, archetype) {
    // Validate only essential characteristics
    const baseCharacteristics = [
        'sweetness',
        'acidity',
        'tannins',
        'aroma',
        'body',
        'spice'
    ];

    const missing = baseCharacteristics.filter(prop => wine[prop] === undefined);
    
    if (missing.length > 0) {
        throw new Error(`Wine object is missing base characteristics: ${missing.join(', ')}`);
    }

    return true;
}

export function balanceCalculator(wine, archetype) {
    // Ensure inventory is loaded
    loadInventory();
    
    // Validate wine object with archetype context
    validateWineObject(wine, archetype);

    // Calculate synergy first since we need it for deduction calculations
    let synergyBonus = 0;
    for (const synergy of Object.values(synergyBonuses)) {
        if (synergy.condition(wine)) {
            synergyBonus += synergy.bonus(wine);
        }
    }
    synergyBonus = Math.min(synergyBonus, 0.2);

    // Calculate dynamic balance with synergy affecting deductions
    let dynamicBalance = dynamicBalanceScore(wine, baseBalancedRanges, synergyBonus);
    
    let finalScore;
    if (archetype && qualifiesForArchetype(wine, archetype)) {
        let midpointScore = distanceScore(wine, archetype);
        let groupBalance = balanceScore(wine, archetype);
        let archetypeBalance = (midpointScore + groupBalance) / 2;
        finalScore = Math.max(archetypeBalance, dynamicBalance);
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

// Archtype calculations
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

function calculateNearestArchetype(wine) {
    let bestDistance = Infinity;
    let nearestArchetype = null;

    for (const [key, archetype] of Object.entries(archetypes)) {
        // Skip if required grapes don't match
        if (archetype.requirements?.requiredGrapes && 
            !archetype.requirements.requiredGrapes.includes(wine.resource?.name)) {
            continue;
        }

        let totalDistance = 0;
        
        // Access idealRanges through characteristics property
        for (const [characteristic, range] of Object.entries(archetype.characteristics.idealRanges)) {
            const value = wine[characteristic];
            const [min, max] = range;
            
            if (value < min) {
                totalDistance += min - value;
            } else if (value > max) {
                totalDistance += value - max;
            }
        }

        if (totalDistance < bestDistance) {
            bestDistance = totalDistance;
            nearestArchetype = archetype;
        }
    }

    return {
        archetype: nearestArchetype,
        distance: bestDistance,
        qualifies: bestDistance === 0
    };
}

export { calculateNearestArchetype };
