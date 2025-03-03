import { archetypes } from './../constants/archetypes.js';

// Checks if a specific requirement is met by a wine
export function checkSpecificRequirement(wine, requirement, value) {
    let actualValue;
    
    switch(requirement) {
        case 'requiredColor':
            actualValue = wine.resource?.grapeColor;
            return actualValue === value;
            
        case 'requiredGrapes':
            actualValue = wine.resource?.name;
            return Array.isArray(value) && actualValue && value.includes(actualValue);
            
        case 'minimumQuality':
            // Parse quality if it's a string
            actualValue = typeof wine.quality === 'string' ? parseFloat(wine.quality) : wine.quality;
            return typeof actualValue === 'number' && actualValue >= value;
            
        case 'minimumVintage':
            actualValue = wine.vintage;
            return typeof actualValue === 'number' && actualValue >= value;
            
        case 'minimumPrestige':
            actualValue = wine.fieldPrestige;
            return typeof actualValue === 'number' && actualValue >= value;
            
        case 'oxidationRange':
            actualValue = wine.oxidation;
            return typeof actualValue === 'number' && actualValue >= value[0] && actualValue <= value[1];
            
        case 'ripenessRange':
            actualValue = wine.ripeness;
            return typeof actualValue === 'number' && actualValue >= value[0] && actualValue <= value[1];
            
        default:
            actualValue = wine[requirement];
            return false;
    }
}

// Checks if wine meets processing requirements
export function checkProcessingRequirements(wine, processingReqs) {
    if (!processingReqs) return true;
    
    // Check ecological requirement
    if (processingReqs.requireEcological && 
        (!wine.fieldSource?.conventional === 'Ecological')) {
        return false;
    }
    
    // Check crushing methods
    if (processingReqs.allowedMethods && 
        !processingReqs.allowedMethods.includes(wine.crushingMethod)) {
        return false;
    }
    
    return true;
}

// Checks if wine meets regional requirements
export function checkRegionalRequirements(wine, regionalReqs) {
    if (!regionalReqs) return true;
    
    // Get country directly from the wine object
    const country = wine.country;
    
    // Check country
    if (regionalReqs.country && country !== regionalReqs.country) {
        return false;
    }
    
    // Get region directly from the wine object
    const region = wine.region;
    
    // Check regions
    if (regionalReqs.regions && (!region || !regionalReqs.regions.includes(region))) {
        return false;
    }
    
    // Check soil types
    if (regionalReqs.soilTypes && 
        (!wine.fieldSource?.soil || !regionalReqs.soilTypes.includes(wine.fieldSource.soil))) {
        return false;
    }
    
    // Check terrain types
    if (regionalReqs.terrainTypes && 
        (!wine.fieldSource?.terrain || !regionalReqs.terrainTypes.includes(wine.fieldSource.terrain))) {
        return false;
    }
    
    return true;
}

// Checks if a wine qualifies for a given archetype
export function qualifiesForArchetype(wine, archetype) {
    if (!wine || !archetype) {
        return false;
    }

    // Check basic requirements
    if (archetype.requirements) {
        for (const [requirement, value] of Object.entries(archetype.requirements)) {
            if (!checkSpecificRequirement(wine, requirement, value)) {
                return false;
            }
        }
    }

    // Check processing requirements
    if (!checkProcessingRequirements(wine, archetype.processingReqs)) {
        return false;
    }

    // Check regional requirements
    if (!checkRegionalRequirements(wine, archetype.regionalReqs)) {
        return false;
    }

    // Check characteristic ranges
    if (archetype.characteristics?.idealRanges) {
        for (const [trait, [min, max]] of Object.entries(archetype.characteristics.idealRanges)) {
            if (wine[trait] < min || wine[trait] > max) {
                return false;
            }
        }
    }

    return true;
}

// Calculates how close a wine is to the ideal values of an archetype
export function distanceScore(wine, archetype) {
    if (!archetype?.characteristics?.idealRanges) return 0;
    let totalScore = 0;
    let totalWeight = 0;

    for (const [characteristic, [min, max]] of Object.entries(archetype.characteristics.idealRanges)) {
        const midpoint = (min + max) / 2;
        const value = wine[characteristic];
        const importance = archetype.characteristics.importance?.[characteristic] || 1;

        let distance = Math.abs(value - midpoint) / (max - min);
        let score = Math.pow(1 - Math.pow(distance, 2), importance);

        totalScore += score * importance;
        totalWeight += importance;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
}

// Calculates score based on how well balanced the wine's characteristics are
export function balanceScore(wine, archetype) {
    if (!archetype?.balanceGroups) return 0;
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const group of archetype.balanceGroups) {
        let values = group.map(char => wine[char]);
        
        let weight = group.reduce((sum, char) => {
            const importance = archetype.characteristics?.importance?.[char] || 1;
            return sum + importance;
        }, 0) / group.length;

        let pairwiseDistances = [];
        for (let i = 0; i < values.length; i++) {
            for (let j = i + 1; j < values.length; j++) {
                let difference = Math.abs(values[i] - values[j]);
                pairwiseDistances.push(difference);
            }
        }

        const avgDistance = pairwiseDistances.reduce((a, b) => a + b, 0) / pairwiseDistances.length;
        const score = Math.pow(1 - Math.pow(avgDistance, 2), weight);

        totalScore += score * weight;
        totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
}

// Finds the nearest matching archetype for a wine
export function calculateNearestArchetype(wine) {
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

// Formats a requirement for display
export function formatRequirement(requirement, value) {
    switch(requirement) {
        case 'requiredColor':
            return `Must be ${value} wine`;
            
        case 'requiredGrapes':
            return `Must use: ${value.join(' or ')}`;
            
        case 'minimumQuality':
            return `Quality ≥ ${(value * 100).toFixed(0)}%`;
            
        case 'minimumVintage':
            return `Vintage ≥ ${value}`;
            
        case 'minimumPrestige':
            return `Prestige ≥ ${(value * 100).toFixed(0)}%`;
            
        case 'oxidationRange':
            return `Oxidation: ${(value[0] * 100).toFixed(0)}%-${(value[1] * 100).toFixed(0)}%`;
            
        case 'ripenessRange':
            return `Ripeness: ${(value[0] * 100).toFixed(0)}%-${(value[1] * 100).toFixed(0)}%`;
            
        case 'processingReqs':
            let reqs = [];
            if (value.requireEcological) reqs.push('Must be ecological');
            if (value.allowedMethods) reqs.push(`Methods: ${value.allowedMethods.join(', ')}`);
            return reqs.join(', ');
            
        case 'regionalReqs':
            let regions = [];
            if (value.country) regions.push(`Country: ${value.country}`);
            if (value.regions) regions.push(`Region: ${value.regions.join(', ')}`);
            if (value.soilTypes) regions.push(`Soil: ${value.soilTypes.join(', ')}`);
            return regions.join(', ');
            
        default:
            return JSON.stringify(value);
    }
}

// Enhances a wine object by converting string values to numbers
export function processWineObject(wine) {
    return {
        ...wine,
        quality: typeof wine.quality === 'string' ? parseFloat(wine.quality) : wine.quality,
        sweetness: typeof wine.sweetness === 'string' ? parseFloat(wine.sweetness) : wine.sweetness,
        acidity: typeof wine.acidity === 'string' ? parseFloat(wine.acidity) : wine.acidity,
        tannins: typeof wine.tannins === 'string' ? parseFloat(wine.tannins) : wine.tannins,
        aroma: typeof wine.aroma === 'string' ? parseFloat(wine.aroma) : wine.aroma,
        body: typeof wine.body === 'string' ? parseFloat(wine.body) : wine.body,
        spice: typeof wine.spice === 'string' ? parseFloat(wine.spice) : wine.spice,
        country: wine.country || null,
        region: wine.region || null
    };
}

// Finds the best archetype match for a wine
export function findBestArchetypeMatch(wine) {
    let bestMatch = { archetype: null, score: 0, qualifies: false };
    
    for (const [name, arch] of Object.entries(archetypes)) {
        const qualifies = qualifiesForArchetype(wine, arch);
        if (qualifies) {
            const midpointScore = distanceScore(wine, arch);
            const groupBalance = balanceScore(wine, arch);
            const archetypeScore = (midpointScore + groupBalance) / 2;
            
            if (archetypeScore > bestMatch.score) {
                bestMatch = { 
                    archetype: arch, 
                    score: archetypeScore,
                    qualifies: true,
                    name: name
                };
            }
        }
    }
    
    return bestMatch;
}

// Validates that a wine object contains all required base characteristics
export function validateWineObject(wine) {
    const baseCharacteristics = [
        'sweetness', 'acidity', 'tannins', 
        'aroma', 'body', 'spice'
    ];

    const missing = baseCharacteristics.filter(prop => wine[prop] === undefined);
    
    if (missing.length > 0) {
        throw new Error(`Wine object is missing base characteristics: ${missing.join(', ')}`);
    }

    return true;
}

// Creates detailed log messages for testing wine against archetype
export function testWineAgainstArchetype(wine, archetype, dynamicBalanceScoreFn) {
    let qualifies = true;
    let log = [];
    
    // Check basic requirements
    if (archetype.requirements) {
        for (const [req, value] of Object.entries(archetype.requirements)) {
            let actualValue;
            
            switch(req) {
                case 'requiredColor':
                    actualValue = wine.resource?.grapeColor;
                    break;
                case 'requiredGrapes':
                    actualValue = wine.resource?.name;
                    break;
                case 'minimumQuality':
                    actualValue = typeof wine.quality === 'string' ? parseFloat(wine.quality) : wine.quality;
                    break;
                case 'minimumVintage':
                    actualValue = wine.vintage;
                    break;
                case 'minimumPrestige':
                    actualValue = wine.fieldPrestige;
                    break;
                case 'oxidationRange':
                    actualValue = wine.oxidation;
                    break;
                case 'ripenessRange':
                    actualValue = wine.ripeness;
                    break;
                default:
                    actualValue = wine[req];
            }
            
            const passed = checkSpecificRequirement(wine, req, value);
            qualifies = qualifies && passed;
        }
    }

    // Check processing requirements
    if (archetype.processingReqs) {
        const procPassed = checkProcessingRequirements(wine, archetype.processingReqs);
        qualifies = qualifies && procPassed;
    }

    // Check regional requirements
    if (archetype.regionalReqs) {
        const regPassed = checkRegionalRequirements(wine, archetype.regionalReqs);
        qualifies = qualifies && regPassed;
    }

    // Check characteristics
    let charsPassed = true;
    if (archetype.characteristics?.idealRanges) {
        for (const [trait, [min, max]] of Object.entries(archetype.characteristics.idealRanges)) {
            const rawValue = wine[trait];
            const value = typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue;
            const passed = value !== undefined && value >= min && value <= max;
            charsPassed = charsPassed && passed;
        }
    }
    qualifies = qualifies && charsPassed;

    // Calculate scores
    const midpointScore = distanceScore(wine, archetype);
    const groupBalance = balanceScore(wine, archetype);
    const archetypeBalance = (midpointScore + groupBalance) / 2;
    const dynamicBalance = dynamicBalanceScoreFn(wine);
    const finalScore = qualifies ? Math.max(archetypeBalance, dynamicBalance) : dynamicBalance;

    return {
        qualifies,
        midpointScore,
        groupBalance,
        archetypeBalance,
        dynamicBalance,
        finalScore,
        log
    };
}
